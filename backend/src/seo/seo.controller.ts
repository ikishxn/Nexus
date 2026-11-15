import { Controller, Get, Req, Res, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Realm, RealmDocument } from '../realms/schemas/realm.schema';

const DEFAULT_NEXUS_LOGO = 'https://nexus.dev/og-default.png';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Controller()
export class SeoController {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Realm.name) private readonly realmModel: Model<RealmDocument>,
  ) {}

  private getIndexHtml(): string {
    const candidatePaths = [
      path.resolve(process.cwd(), '../frontend/dist/index.html'),
      path.resolve(process.cwd(), 'frontend/dist/index.html'),
      path.resolve(__dirname, '../../../frontend/dist/index.html'),
      path.resolve(__dirname, '../../../../frontend/dist/index.html'),
      path.resolve(process.cwd(), '../frontend/index.html'),
      path.resolve(process.cwd(), 'frontend/index.html'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p, 'utf-8');
        } catch {
          // try next candidate
        }
      }
    }

    // Default minimal HTML fallback
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Nexus | The Verified Knowledge Network</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
  }

  @Get(['/post/:id', '/posts/:id', '/n/:realmName'])
  async handleDeepLink(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id?: string,
    @Param('realmName') realmName?: string,
  ) {
    const rawHtml = this.getIndexHtml();
    const url = req.originalUrl || req.url || '';

    let title = 'Nexus | The Verified Knowledge Network';
    let description =
      'Nexus is a premium Q&A and verified knowledge-sharing platform for developers to discuss code, design, and architecture.';
    let imageUrl = DEFAULT_NEXUS_LOGO;

    try {
      // 1. Determine if this request is for a Post
      if (url.includes('/post') || id) {
        const postId = id || url.split('/post/')[1]?.split('?')[0]?.split('#')[0] || url.split('/posts/')[1]?.split('?')[0]?.split('#')[0];
        if (postId && Types.ObjectId.isValid(postId)) {
          const post = await this.postModel
            .findById(postId)
            .populate('author', 'username')
            .lean();

          if (post) {
            title = `Nexus: ${post.title}`;
            const authorName = (post.author as any)?.username ? `by ${(post.author as any).username} · ` : '';
            const rawText = post.content?.text || '';
            const cleanedText = rawText.replace(/\s+/g, ' ').trim();
            const truncated = cleanedText.length > 160 ? `${cleanedText.slice(0, 157)}...` : cleanedText;
            description = `${authorName}${truncated || 'Explore this technical discussion on Nexus.'}`;

            if (post.content?.mediaUrls && post.content.mediaUrls.length > 0) {
              imageUrl = post.content.mediaUrls[0];
            }
          }
        }
      } else if (url.includes('/n/') || realmName) {
        // 2. Determine if this request is for a Realm
        const targetRealm = realmName || url.split('/n/')[1]?.split('?')[0]?.split('#')[0];
        if (targetRealm) {
          const realm = await this.realmModel
            .findOne({ name: targetRealm.toLowerCase() })
            .lean();

          if (realm) {
            title = `Nexus Realm: ${realm.displayName || realm.name}`;
            description =
              realm.description?.trim() ||
              `Join n/${realm.name} with ${(realm.memberCount || 1).toLocaleString()} members on Nexus.`;
          }
        }
      }
    } catch (err) {
      // Fallback cleanly to default meta tags on any DB or parse failure
      console.error('SeoController error fetching document:', err);
    }

    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(description);
    const safeImg = escapeHtml(imageUrl);

    const metaTags = `
    <!-- Dynamic Open Graph & Social Cards injected by Nexus SEO Engine -->
    <title>${safeTitle}</title>
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImg}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImg}" />
    `;

    const injectedHtml = rawHtml.replace('</head>', `${metaTags}</head>`);
    return res.type('html').send(injectedHtml);
  }
}

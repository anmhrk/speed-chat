import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation } from './_generated/server';
import { betterAuthComponent } from './auth';

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const storeFile = mutation({
  args: {
    fileId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError('User not authenticated');
    }

    const url = await ctx.storage.getUrl(args.fileId);

    if (!url) {
      throw new Error('Failed to get file url');
    }

    await ctx.db.insert('attachments', {
      id: args.fileId,
      url,
      userId: userId as Id<'users'>,
    });

    return url;
  },
});

export const deleteFiles = mutation({
  args: {
    fileUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const storageIds: Id<'_storage'>[] = [];

    for (const url of args.fileUrls) {
      const attachment = await ctx.db
        .query('attachments')
        .withIndex('by_url', (q) => q.eq('url', url))
        .first();

      if (attachment) {
        storageIds.push(attachment.id);
        await ctx.db.delete(attachment._id);
      }
    }

    for (const id of storageIds) {
      await ctx.storage.delete(id);
    }
  },
});

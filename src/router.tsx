import { createRouter } from '@tanstack/react-router';

import { deLocalizeUrl, localizeUrl } from '@/paraglide/runtime.js';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    // Paraglide owns locale prefixes: incoming URLs are de-localized before
    // matching (routes are locale-free), outgoing hrefs get re-localized.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
  });
  return router;
}
// Declaration Merging
//「我要给 @tanstack/react-router这个模块打补丁
// 把它的 Register接口里的 router字段，改成我自己的 router 类型」
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}



/**
 * ┌──────────────┐
 * │ /en/posts/123│  ← 浏览器输入 / 刷新 / 后退
 * └──────┬───────┘
 *        ↓ input() 决定 URL 在进入 Router 之前如何被解释
 *  ┌─────┴──────┐
 *  │ /posts/123  │ ← Router 看到的（路由世界）。     input 时保存了语言参数，在页面生成时会调用一个函数获取语言；这样就不需要语言这个位置参数了
 *  └──────┬──────┘
 *         ↓ 路由匹配 / loader
 *  ┌──────┴──────┐
 *  │ /posts/123  │
 *  └──────┬──────┘
 *         ↓ output()决定 Router 产出的 URL 如何被写回浏览器 / 页面
 *  ┌──────┴──────┐
 *  │ /en/posts/123│ ← 写入地址栏 / <a href> / history
 *  └──────────────┘
 */

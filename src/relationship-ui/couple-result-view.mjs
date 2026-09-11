import { buildCoupleResultContent } from '../couple-result/copy-engine.mjs';

export function renderCoupleResult(container, input) {
  if (!container) throw new TypeError('container required');
  const content = buildCoupleResultContent(input);
  container.replaceChildren();
  const article = document.createElement('article'); article.className='couple-result rounded-3xl border border-neonpurple/30 bg-white/[0.04] p-6 text-white';
  const h= document.createElement('h1'); h.textContent=content.hero.headline; h.className='text-2xl font-extrabold text-neonpink';
  const sub=document.createElement('p'); sub.textContent=content.hero.subcopy; sub.className='mt-3 text-sm leading-relaxed text-purple-100';
  const story=document.createElement('p'); story.textContent=content.coreStory; story.className='mt-5 text-sm leading-relaxed';
  const mission=document.createElement('section'); mission.className='mt-5 rounded-2xl border border-neonpink/30 p-4'; mission.innerHTML='<h2 class="font-semibold"></h2><p class="mt-2 text-sm leading-relaxed"></p>'; mission.querySelector('h2').textContent=content.mission.title; mission.querySelector('p').textContent=content.mission.body;
  article.append(h,sub,story,mission); container.append(article); return content;
}

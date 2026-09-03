// FIMLU Local Story Engine
// Browser-only deterministic content engine. No external API, account, or network request required.

const delay = (ms = 220) => new Promise(resolve => setTimeout(resolve, ms));

const clean = (value = '') => String(value).replace(/[\[\]]/g, '').trim();
const stripStar = (value = '') => clean(value).replace(/^⭐\s*/, '');
const titleCase = (value = '') => value.replace(/\b\w/g, c => c.toUpperCase());

const hash = (value = '') => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
};

const pick = (arr, seed, offset = 0) => arr[(seed + offset) % arr.length];

const extractQuoted = (prompt, label) => {
  const re = new RegExp(`${label}\\s*:?\\s*"([^"]+)"`, 'i');
  return prompt.match(re)?.[1]?.trim() || '';
};

const extractAfter = (prompt, label, until = /\n/) => {
  const i = prompt.toLowerCase().indexOf(label.toLowerCase());
  if (i < 0) return '';
  const tail = prompt.slice(i + label.length);
  const match = tail.match(until);
  return clean(match ? tail.slice(0, match.index) : tail);
};

const parseBriefLines = (prompt) => {
  const result = {};
  const known = [
    'Parent Problem','Child Perspective','Core Lesson','Target Skill','Observable Success Behavior','Story Mechanism',
    'Main Character','Character Age-Equivalent','Character Personality','Character Appearance','Supporting Characters',
    'Setting / Story World','Parent Value','Practical Child Action','Series Name','Series Potential','Global Visual Direction'
  ];
  for (const label of known) {
    const re = new RegExp(`${label.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}:\\s*([^\\n]+)`, 'i');
    const value = prompt.match(re)?.[1];
    if (value) result[label] = stripStar(value);
  }
  return result;
};

const categoryProfile = (category = '') => {
  const c = category.toLowerCase();
  if (c.includes('animal')) return { theme: 'kind choices', hero: 'Pip', species: 'red panda', setting: 'sunlit woodland village', object: 'little leaf token', friend: 'Tala the rabbit' };
  if (c.includes('fantasy') || c.includes('magic')) return { theme: 'brave choices', hero: 'Nova', species: 'young human child', setting: 'glowing garden of lantern trees', object: 'tiny star lantern', friend: 'Milo, a gentle cloud creature' };
  if (c.includes('communication')) return { theme: 'speaking and listening', hero: 'Maya', species: 'human child', setting: 'bright family home and school garden', object: 'listening card', friend: 'Kai, a cheerful classmate' };
  if (c.includes('respect')) return { theme: 'respectful words and manners', hero: 'Leo', species: 'human child', setting: 'warm family home and neighborhood', object: 'kindness badge', friend: 'Ari, a patient friend' };
  if (c.includes('emotional')) return { theme: 'calming strong feelings', hero: 'Ruby', species: 'human child', setting: 'cozy home and leafy neighborhood park', object: 'calm-down card', friend: 'Evan, a younger sibling' };
  if (c.includes('friendship') || c.includes('kindness') || c.includes('empathy')) return { theme: 'friendship and empathy', hero: 'Mia', species: 'human child', setting: 'colorful school garden', object: 'friendship bracelet', friend: 'Sam, a thoughtful classmate' };
  if (c.includes('responsibility')) return { theme: 'responsible choices', hero: 'Noah', species: 'human child', setting: 'tidy family home and classroom', object: 'simple responsibility chart', friend: 'Lina, an encouraging friend' };
  if (c.includes('confidence') || c.includes('courage') || c.includes('adventure')) return { theme: 'confidence and brave action', hero: 'Ari', species: 'human child', setting: 'sunny neighborhood adventure trail', object: 'small courage token', friend: 'Mika, an adventurous friend' };
  if (c.includes('honesty')) return { theme: 'honesty and making things right', hero: 'Ben', species: 'human child', setting: 'warm family home', object: 'truth card', friend: 'Lila, a caring sibling' };
  if (c.includes('family')) return { theme: 'family connection', hero: 'Luna', species: 'human child', setting: 'cozy multigenerational family home', object: 'family picture', friend: 'Nico, a playful sibling' };
  if (c.includes('bedtime') || c.includes('routine')) return { theme: 'calm routines', hero: 'Theo', species: 'human child', setting: 'cozy bedroom and warm family home', object: 'bedtime checklist', friend: 'Mimi, a favorite plush bunny' };
  if (c.includes('healthy')) return { theme: 'healthy everyday habits', hero: 'Zoe', species: 'human child', setting: 'bright home kitchen and garden', object: 'healthy-habit chart', friend: 'Max, an energetic sibling' };
  if (c.includes('safety')) return { theme: 'safe choices', hero: 'Eli', species: 'human child', setting: 'bright home and neighborhood', object: 'safety reminder card', friend: 'Nina, a careful friend' };
  if (c.includes('faith')) return { theme: 'faith, gratitude, and kindness', hero: 'Anna', species: 'human child', setting: 'warm family home and peaceful garden', object: 'gratitude journal', friend: 'Joel, a gentle sibling' };
  return { theme: category ? category.toLowerCase() : 'growing and learning', hero: 'Maya', species: 'human child', setting: 'bright, welcoming story world', object: 'small reminder card', friend: 'Kai, a supportive friend' };
};

const titleBank = (category, age) => {
  const p = categoryProfile(category);
  const c = category.toLowerCase();
  let candidates;
  if (c.includes('emotional')) candidates = ['The Calm Spark','When Feelings Roar','My Quiet Power','The Gentle Reset','Big Feelings, Brave Heart'];
  else if (c.includes('communication')) candidates = ['The Listening Lantern','Words That Connect','My Turn to Listen','The Talking Bridge','Hear Me Kindly'];
  else if (c.includes('respect')) candidates = ['Magic Manners','The Respect Ripple','Kind Words First','Please, Thanks, Smile','The Polite Path'];
  else if (c.includes('friendship')) candidates = ['The Friendship Bridge','Room for Two','A Better Teammate','The Sharing Spark','Friends Find a Way'];
  else if (c.includes('responsibility')) candidates = ['I Can Handle It','The Ready Kid','My Helpful Habit','The Responsibility Race','Done Before Fun'];
  else if (c.includes('confidence') || c.includes('courage')) candidates = ['Brave Little Steps','I Can Try','The Courage Button','One More Try','My Brave Voice'];
  else if (c.includes('kindness') || c.includes('empathy')) candidates = ['The Kindness Ripple','I See You','A Heart That Helps','Kindness Comes Back','The Caring Choice'];
  else if (c.includes('honesty')) candidates = ['The Truth Spark','Brave Enough to Tell','The Honest Choice','Truth Makes It Right','My Truthful Voice'];
  else if (c.includes('family')) candidates = ['Our Family Glow','Home Is Together','The Helping Circle','Love Lives Here','Family Makes Room'];
  else if (c.includes('bedtime') || c.includes('routine')) candidates = ['The Sleepy Steps','Ready for Bed','My Nighttime Rhythm','The Cozy Routine','Goodnight, Little Day'];
  else if (c.includes('healthy')) candidates = ['Strong Every Day','The Healthy Habit','Fuel for Fun','My Body Team','Bright Morning Choices'];
  else if (c.includes('safety')) candidates = ['Safe Steps First','The Safety Signal','Stop, Look, Choose','My Safe Choice','Ready, Set, Safe'];
  else if (c.includes('adventure')) candidates = ['The Brave Trail','Beyond the Garden Gate','The Little Explorer','One More Hill','Adventure Starts Here'];
  else if (c.includes('fantasy') || c.includes('magic')) candidates = ['The Star Lantern','Moonbeam Garden','The Tiny Spell','Cloud Castle Secret','The Wishing Path'];
  else if (c.includes('animal')) candidates = ['Pip Finds a Way','The Kind Little Panda','Forest Friends First','The Helpful Paw','Pip Shares the Trail'];
  else if (c.includes('faith')) candidates = ['Little Light, Big Faith','My Grateful Heart','The Thankful Day','Love Shines Here','A Little Prayer'];
  else {
    const topic = titleCase(category || p.theme).split(/\s+/).slice(0, 2).join(' ');
    candidates = [`The ${topic} Spark`,`${topic} Starts Here`,`My ${topic} Way`,`The Little ${topic}`,`${topic} Every Day`];
  }
  return candidates.slice(0,5).map((title, i) => ({
    title,
    whyItWorks: `Short, memorable, and easy to visualize for ${age || 'young readers'}, with a clear ${p.theme} promise for parents and children.`,
    ratings: {
      memorability: 9 - (i % 2) * 0.3,
      curiosity: 8.6 + ((i + 1) % 3) * 0.2,
      parentAppeal: 9.1 - (i % 3) * 0.2,
      childAppeal: 8.8 + (i % 2) * 0.2,
      storyPotential: 9.2 - (i % 2) * 0.2,
      overallRating: Number((9.05 - i * 0.08).toFixed(1))
    }
  }));
};

const briefSuggestions = (title, category, age) => {
  const p = categoryProfile(category);
  const childAge = age?.match(/\d+/)?.[0] || '6';
  const base = {
    parentProblem: [`⭐ Child struggles with ${p.theme} during everyday moments.`,`Parent wants a simple, repeatable way to coach ${p.theme}.`,`Small conflicts grow because the child needs a clearer next step.`],
    childPerspective: [`⭐ ${p.hero} wants to do well but reacts before thinking.`,`${p.hero} feels misunderstood when a situation becomes difficult.`,`${p.hero} wants independence while still needing a gentle guide.`],
    coreLesson: [`⭐ Small choices can turn a hard moment into a better one.`,`Pause, notice, choose, and repair when needed.`,`Practice makes the new skill easier each time.`],
    targetSkill: [`⭐ ${titleCase(p.theme)} through one simple repeatable routine.`,`Recognizing the moment before reacting.`,`Using a calm, concrete next step.`],
    successBehavior: [`⭐ ${p.hero} independently pauses and uses the learned action.`,`${p.hero} names what is needed and responds respectfully.`,`${p.hero} repairs a small mistake without being prompted.`],
    storyMechanism: [`⭐ A recurring ${p.object} visually reminds ${p.hero} of the new skill.`,`A three-step challenge repeats with increasing confidence.`,`A gentle cause-and-effect pattern shows how choices change outcomes.`],
    mainCharacter: [`⭐ ${p.hero} — a warm, expressive ${p.species} designed for clear emotional storytelling.`,`${p.hero} — curious, relatable, and easy for children to recognize across pages.`,`${p.hero} — energetic but thoughtful, with a strong visual silhouette.`],
    characterAge: [`⭐ About ${childAge} years old / age-equivalent.`,`One year younger for a more playful tone.`,`One year older for slightly more independent behavior.`],
    characterPersonality: [`⭐ Curious, loving, quick to react, and eager to learn.`,`Playful, observant, and quietly determined.`,`Warm-hearted, expressive, and resilient after mistakes.`],
    characterAppearance: [`⭐ Distinct expressive eyes, clean silhouette, modern child-friendly attire, and one consistent signature color.`,`Soft rounded features, natural proportions, simple contemporary clothing, and clear facial readability.`,`Premium stylized 3D design with recognizable hair/fur shape and consistent outfit.`],
    supportingCharacters: [`⭐ ${p.friend}; one warm adult guide who supports without taking over.`,`A sibling or friend who provides a natural social mirror.`,`One calm parent/guardian plus one peer for varied interactions.`],
    setting: [`⭐ ${titleCase(p.setting)} with recurring visual landmarks.`,`A small set of familiar places that feel safe, bright, and easy to follow.`,`A warm story world with clear indoor/outdoor transitions and natural negative space.`],
    parentValue: [`⭐ Gives parents a concrete phrase and action they can reuse after reading.`,`Models connection before correction.`,`Turns the lesson into a practical family routine.`],
    childAction: [`⭐ Pause, take one slow breath, name the need, then choose one helpful action.`,`Use a short three-step reminder: Stop, Notice, Choose.`,`Practice one visible action the child can repeat at home or school.`],
    seriesName: [`⭐ Little Skills, Big Growth`,`Everyday Brave Kids`,`Small Steps Storybooks`],
    seriesPotential: [`⭐ Reuse the character for a sequence of everyday social-emotional skills.`,`Expand into home, school, friendship, routine, and confidence topics.`,`Build a recognizable parent toolkit series around one practical skill per book.`],
    visualDirection: [`⭐ Premium colorful stylized 3D picture-book look; crisp background detail; warm cinematic light; expressive eyes; 3:4 portrait.`,`Bright high-end 3D storybook scenes with clean compositions and strong readable emotion.`,`Polished family-friendly 3D visuals with consistent character design, natural depth, and uncluttered text space.`]
  };
  return base;
};

const parseCategoryFromPrompt = (prompt) => extractQuoted(prompt, 'Category') || prompt.match(/Category:\s*"?([^"\n]+)"?/i)?.[1]?.trim() || '';
const parseAgeFromPrompt = (prompt) => extractQuoted(prompt, 'Age') || prompt.match(/Target Age:\s*([^\n.]+)/i)?.[1]?.trim() || '';
const parseTitleFromPrompt = (prompt) => extractQuoted(prompt, 'Title') || prompt.match(/(?:for|of)\s+"([^"]+)"/i)?.[1]?.trim() || 'My Storybook';

const makeStoryPages = (title, prompt) => {
  const brief = parseBriefLines(prompt);
  const hero = (brief['Main Character'] || 'Maya').split(/[—,-]/)[0].trim().replace(/^⭐\s*/, '') || 'Maya';
  const skill = stripStar(brief['Target Skill'] || extractAfter(prompt, 'One Skill:') || 'a helpful new skill');
  const action = stripStar(brief['Practical Child Action'] || extractAfter(prompt, 'One Action:') || 'pause, notice, and choose');
  const setting = stripStar(brief['Setting / Story World'] || 'their familiar day');
  const object = stripStar(brief['Story Mechanism'] || 'a simple reminder');
  const sections = ['Hook','Hook','Problem','Problem','Impact','Impact','Recognition','Recognition','Discovery','Discovery','Practice','Practice','Struggle / Retry','Success & Repair','Warm Resolution'];
  const texts = [
    `${hero} began the day feeling ready for something wonderful in ${setting.replace(/[.!?]+$/, '')}.`,
    `Then one small moment changed the plan, and ${hero} felt a big reaction rushing in.`,
    `${hero} wanted things to go differently and almost forgot the best next step.`,
    `The harder ${hero} pushed, the harder the moment seemed to become.`,
    `A friend noticed, and ${hero} saw how one choice could affect everyone nearby.`,
    `${hero} did not like that feeling and wished there were a better way.`,
    `That was when ${hero} remembered: ${skill} can begin with one tiny pause.`,
    `${hero} looked at ${object} and decided to try instead of giving up.`,
    `First, ${hero} slowed down enough to notice what was happening inside.`,
    `Next, ${hero} used the simple action: ${action}.`,
    `The first try felt awkward, but the moment became a little easier.`,
    `${hero} practiced again, this time with a calmer face and clearer choice.`,
    `Another tricky moment arrived, and ${hero} nearly slipped back into the old habit.`,
    `${hero} tried once more, made a helpful choice, and repaired what had gone wrong.`,
    `By the end, ${hero} knew that small brave steps can grow into strong everyday habits.`
  ];
  return texts.map((text, i) => ({ pageNumber: i + 1, section: sections[i], text: clean(text).split(/\s+/).slice(0,25).join(' '), }));
};

const makeLearningPages = (title, prompt) => {
  const brief = parseBriefLines(prompt);
  const hero = (brief['Main Character'] || 'the child').split(/[—,-]/)[0].trim().replace(/^⭐\s*/, '') || 'the child';
  const action = stripStar(brief['Practical Child Action'] || extractAfter(prompt, 'One Action:') || 'pause, notice, and choose one helpful action');
  const skill = stripStar(brief['Target Skill'] || extractAfter(prompt, 'One Skill:') || 'the new skill');
  const pages = [
    ['Emotional Lesson', `Big feelings are real, but they do not have to make every decision. ${hero} learned that noticing a feeling creates a tiny space for a better choice. That space is where ${skill} can grow, one calm attempt at a time.`],
    ['Emotional Lesson', `A hard moment does not mean a child is failing. It is a practice moment. When children pause, feel supported, and try a simple next step, they begin building confidence that can carry into home, school, friendships, and everyday routines.`],
    ['Real-Life Application', `Try the skill during an ordinary moment this week. Before correcting, name what is happening in simple words. Then guide the child through this action: ${action}. Keep the tone warm and brief so the child can focus on doing, not on a long explanation.`],
    ['Real-Life Application', `Practice when everyone is calm, not only when a problem happens. Turn the skill into a tiny game or family routine. Repeating it during easy moments helps the child remember what to do when emotions, distractions, or disagreements make the same skill harder.`],
    ['Parent Conversation', `Ask: “What did ${hero} notice before making a better choice?” Then ask, “When might that happen to you?” Listen without rushing to correct the answer. The goal is connection and reflection. Help the child choose one realistic situation where the story’s skill could help.`],
    ['Parent Conversation', `You can also ask: “What could I say that would help you remember?” Agree on one short family cue. Keep it respectful and predictable. A simple cue works best when the child already knows the action and has practiced it with support.`],
    ['Child Action', `My action plan: I can ${action}. I do not have to do it perfectly. I can try, notice what happens, and try again. Each good choice is one small step that helps my brain and body remember what to do next time.`],
    ['Child Action', `Practice challenge: choose one moment today to use the new skill before an adult reminds you. Afterward, notice what changed. Did your body feel calmer? Did the problem get smaller? Did someone understand you better? Celebrate the effort, not only the result.`],
    ['Encouraging Conclusion', `${hero} did not become perfect in one day. Growth happened through small tries, support, and repair. That is how real skills grow. Children become more capable when adults notice progress, keep expectations clear, and make room for another patient attempt.`],
    ['Encouraging Conclusion', `Keep this story close and return to it when the skill feels difficult. The goal is not a perfect child or a perfect day. The goal is one more helpful choice, one more repair, and one more moment of growing together.`]
  ];
  return pages.map((p, i) => ({ pageNumber: i + 16, section: p[0], text: p[1] }));
};

const makeVisualBible = (prompt) => {
  const brief = parseBriefLines(prompt);
  const main = stripStar(brief['Main Character'] || 'Maya — a warm, expressive human child');
  const appearance = stripStar(brief['Character Appearance'] || 'soft rounded features, expressive dark eyes, dark wavy hair, warm medium-brown skin, teal top, cream pants, white sneakers');
  const supporting = stripStar(brief['Supporting Characters'] || 'one warm adult guide and one supportive child friend');
  const setting = stripStar(brief['Setting / Story World'] || 'bright, welcoming family and neighborhood spaces');
  const mechanism = stripStar(brief['Story Mechanism'] || 'one small recurring visual reminder');
  const isAnimal = /animal|panda|rabbit|bear|cat|dog|fox|bird|creature/i.test(main);
  const mainCharacter = isAnimal
    ? `${main}. Exact species lock; consistent fur/skin markings; child-friendly proportions; exact recurring outfit/accessories: ${appearance}. Preserve this anatomy and palette on every page.`
    : `${main}. 1. Face: soft rounded child face with clear expressive features. 2. Hairstyle & Hair Color: consistent natural hairstyle and color from approved brief. 3. Skin Color: consistent natural skin tone from approved brief. 4. Top Attire: exact top design/color from approved brief. 5. Lower Attire: exact lower design/color from approved brief. 6. Shoes: exact shoe design/color from approved brief. Approved appearance anchor: ${appearance}.`;
  return {
    mainCharacter,
    supportingCharacters: `${supporting}. Keep identities, ages, clothing palettes, and proportions visually distinct and consistent across all appearances.`,
    recurringObjects: `${mechanism}. Only include recurring objects when they naturally support the story action; never add random props.`,
    storyWorld: `${setting}. Use a small set of recurring landmarks, warm natural light, clean compositions, and strong continuity between scenes.`
  };
};

const coverConcepts = (title, prompt) => {
  const main = prompt.match(/Main Character:\s*([^\n.]+)/i)?.[1] || 'the main character';
  const world = prompt.match(/Story World:\s*([^\n]+)/i)?.[1] || 'the established story world';
  return {
    v1: { concept: `${main} centered in an iconic welcoming pose inside ${world}, with a clear emotional expression and one recognizable story landmark.`, typographyStyle: 'thick rounded letters with subtle story-world texture and excellent small-thumbnail readability' },
    v2: { concept: `${main} moving energetically through the established world toward a clear story goal, using a dynamic diagonal composition while keeping the upper frame uncluttered.`, typographyStyle: 'bold playful slab letters with energetic dimensional highlights' },
    v3: { concept: `A warm close emotional moment featuring ${main} after a meaningful breakthrough, with gentle eye contact, soft light, and a strong feeling of connection.`, typographyStyle: 'friendly chunky rounded letters with soft tactile depth' },
    v4: { concept: `${main} actively choosing the learned skill in motion, creating a visible transition from tension to a safe, warm resolution within the same scene.`, typographyStyle: 'confident thick rounded letters with clean cinematic depth' },
    v5: { concept: `Cinematic ensemble scene with ${main} prominent in the foreground and supporting characters in the midground, staged in the exact climax setting with the top 40% reserved as atmospheric negative space.`, typographyStyle: 'jumbo cinematic rounded slab letters with premium dimensional texture' }
  };
};

const makePagePrompt = (pageNumber, text, mainCharacter, supportingCharacters, storyWorld, actModifier) => {
  const margin = pageNumber <= 15 ? '15%' : '20%';
  return `PAGE ${pageNumber} — ${clean(text)}\n\nSTRICT IDENTITY ANCHOR: Main Character: ${clean(mainCharacter)}\n${pageNumber > 1 ? `Supporting Characters: ${clean(supportingCharacters || 'None')}\n` : ''}STORY WORLD: ${clean(storyWorld)}\nACT / CAMERA MODIFIER: ${clean(actModifier || 'Cohesive scene matching the page emotion.')}\n\nSCENE DIRECTION: Translate the page meaning into a benign, child-friendly visual moment. Keep character identity, anatomy/species, face, hair/fur, skin/markings, clothing, shoes, and proportions consistent. Use only story-relevant props.\n\nEXACT TEXT OVERLAY: "${clean(text)}" Render this exact text ONCE ONLY. Do not duplicate, rewrite, misspell, or wrap it in brackets.\n\nFIMLU PREMIUM STANDARDS: Vertical 3:4 portrait. Premium colorful stylized 3D children's picture-book render. Crystal-clear environment, natural depth, expressive eyes, warm cinematic lighting, and professional polish. NO solid text boxes, banners, subtitles, speech bubbles, or random decorative props. Build natural negative space for typography. Keep a strict ${margin} clear safety margin on both sides of the centered text block. Use only chunky high-contrast rounded sans-serif or ultra-thick slab-serif typography.`;
};

const parsePageNumber = prompt => Number(prompt.match(/Page\s+(\d+)/i)?.[1] || prompt.match(/PAGE\s+(\d+)/i)?.[1] || 1);

export async function callLocalEngine(prompt, schema = null) {
  await delay();
  const p = String(prompt || '');

  if (/Create exactly 5 completely original/i.test(p)) {
    return titleBank(parseCategoryFromPrompt(p), parseAgeFromPrompt(p));
  }

  if (/Create exactly 1 completely new children's storybook title/i.test(p)) {
    const cat = parseCategoryFromPrompt(p);
    const age = parseAgeFromPrompt(p);
    const existing = p.match(/different from:\s*([^\n]+)/i)?.[1]?.split(',').map(s => s.trim()) || [];
    const bank = titleBank(cat, age);
    const available = bank.filter(x => !existing.includes(x.title));
    if (available.length) return [available[0]];
    const seed = hash(p);
    const profile = categoryProfile(cat);
    return [{
      title: `${pick(['Bright','Brave','Little','Kind','Ready'], seed)} ${pick(['Steps','Spark','Choice','Heart','Way'], seed, 2)}`,
      whyItWorks: `A concise, cover-friendly title centered on ${profile.theme}.`,
      ratings: { memorability: 8.9, curiosity: 8.8, parentAppeal: 9, childAppeal: 8.8, storyPotential: 9, overallRating: 8.9 }
    }];
  }

  if (/Plan a Storybook Creation Brief/i.test(p)) {
    return briefSuggestions(parseTitleFromPrompt(p), parseCategoryFromPrompt(p), parseAgeFromPrompt(p));
  }

  if (/Generate 3 NEW suggestions for:/i.test(p)) {
    const label = extractQuoted(p, 'for') || p.match(/suggestions for:\s*"([^"]+)"/i)?.[1] || '';
    const title = extractQuoted(p, 'Title') || 'Storybook';
    const current = parseBriefLines(p);
    const categoryGuess = current['Core Lesson'] || current['Target Skill'] || '';
    const all = briefSuggestions(title, categoryGuess, 'Ages 4–8');
    const map = {
      'Parent Problem':'parentProblem','Child Perspective':'childPerspective','Core Lesson':'coreLesson','Target Skill':'targetSkill','Observable Success Behavior':'successBehavior','Story Mechanism':'storyMechanism','Main Character':'mainCharacter','Character Age-Equivalent':'characterAge','Character Personality':'characterPersonality','Character Appearance':'characterAppearance','Supporting Characters':'supportingCharacters','Setting / Story World':'setting','Parent Value':'parentValue','Practical Child Action':'childAction','Series Name':'seriesName','Series Potential':'seriesPotential','Global Visual Direction':'visualDirection'
    };
    const arr = all[map[label]] || [`⭐ A fresh, specific ${label.toLowerCase()} option.`,`A second practical ${label.toLowerCase()} option.`,`A third child-friendly ${label.toLowerCase()} option.`];
    return [...arr.slice(1), arr[0]].slice(0,3);
  }

  if (/Write ONLY Story Pages 1-15/i.test(p)) {
    return { pages: makeStoryPages(parseTitleFromPrompt(p), p) };
  }

  if (/Write ONLY Pages 16-25/i.test(p)) {
    return { pages: makeLearningPages(parseTitleFromPrompt(p), p) };
  }

  if (/Create the CHARACTER & VISUAL BIBLE/i.test(p)) {
    return makeVisualBible(p);
  }

  if (/Create 5 DISTINCT PREMIUM COVER CONCEPTS/i.test(p)) {
    return coverConcepts(parseTitleFromPrompt(p), p);
  }

  if (/Regenerate ONLY V[1-5] cover concept/i.test(p)) {
    const variant = p.match(/Regenerate ONLY (V[1-5])/i)?.[1]?.toLowerCase() || 'v1';
    const concepts = coverConcepts(parseTitleFromPrompt(p), p);
    const base = concepts[variant];
    return { ...base, concept: `${base.concept} Alternate composition: shift the camera angle and character staging while preserving the exact visual identity and story world.` };
  }

  if (/HIGH-SPEED BATCH/i.test(p)) {
    const main = p.match(/Main Character:\s*([^\n]+)/i)?.[1] || 'approved main character';
    const support = p.match(/Supporting Characters:\s*([^\n]+)/i)?.[1] || 'approved supporting characters';
    const blocks = [...p.matchAll(/PAGE\s+(\d+)\nStory Text:\s*"([^"]+)"\nAct Modifier:\s*([^\n]+)/gi)];
    return blocks.map(m => ({ pageNumber: Number(m[1]), prompt: makePagePrompt(Number(m[1]), m[2], main, support, 'approved story world from the visual bible', m[3]) }));
  }

  if (/Write ONE complete plain-text Google AI Flow prompt for Page/i.test(p)) {
    const pageNumber = parsePageNumber(p);
    const main = p.match(/Main Character:\s*([^\n]+)/i)?.[1] || 'approved main character';
    const support = p.match(/Supporting Characters:\s*([^\n]+)/i)?.[1] || 'approved supporting characters';
    const world = p.match(/Base World:\s*([^\n]+)/i)?.[1] || 'approved story world';
    const act = p.match(/Current Act Modifier:\s*([^\n]+)/i)?.[1] || '';
    const text = p.match(/PAGE TEXT:\s*"([\s\S]*?)"\s*\n\s*SAFETY/i)?.[1] || '';
    return makePagePrompt(pageNumber, text, main, support, world, act);
  }

  if (/Rewrite ONLY Page\s+\d+/i.test(p)) {
    const pageNumber = parsePageNumber(p);
    const title = parseTitleFromPrompt(p);
    const variants = [
      `A new moment gave the main character another chance to pause, try the helpful skill, and make a better choice.`,
      `The main character noticed the problem, remembered the simple action, and tried again with a calmer and more thoughtful choice.`,
      `With one small pause, the main character found a kinder next step and saw the moment begin to improve.`
    ];
    return { text: variants[(pageNumber + hash(title)) % variants.length] };
  }

  // Schema-safe fallback keeps the application functional even if a future prompt is added.
  if (schema?.type === 'ARRAY') return [];
  if (schema?.type === 'OBJECT') return {};
  return 'Local generation complete.';
}

export async function createLocalImageDataUrl(promptText) {
  await delay(280);
  const raw = clean(promptText || 'FIMLU Storybook');
  const titleMatch = raw.match(/TITLE:\s*"([^"]+)"/i);
  const pageMatch = raw.match(/PAGE\s+(\d+)/i);
  const heading = titleMatch?.[1] || (pageMatch ? `PAGE ${pageMatch[1]}` : 'FIMLU STORYBOOK');
  const subtitle = pageMatch ? 'LOCAL PREVIEW ASSET' : 'PREMIUM 3D PREVIEW';
  const seed = hash(raw);
  const hueA = seed % 360;
  const hueB = (hueA + 55) % 360;
  const safeHeading = heading.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  const safeSubtitle = subtitle.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hueA} 70% 52%)"/><stop offset="1" stop-color="hsl(${hueB} 72% 34%)"/></linearGradient></defs>
    <rect width="600" height="800" rx="28" fill="url(#g)"/>
    <circle cx="480" cy="150" r="150" fill="white" opacity="0.10"/>
    <circle cx="100" cy="690" r="190" fill="white" opacity="0.08"/>
    <rect x="48" y="70" width="504" height="660" rx="28" fill="white" opacity="0.09" stroke="white" stroke-opacity="0.28"/>
    <text x="300" y="325" fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="2">${safeSubtitle}</text>
    <foreignObject x="70" y="360" width="460" height="160"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;text-align:center;color:white;font-family:Arial,sans-serif;font-size:42px;font-weight:800;line-height:1.08;word-break:break-word;">${safeHeading}</div></foreignObject>
    <text x="300" y="590" fill="white" opacity="0.85" text-anchor="middle" font-family="Arial, sans-serif" font-size="18">Generated locally • No API required</text>
    <text x="300" y="624" fill="white" opacity="0.65" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">Use the exported prompt in your preferred image generator</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

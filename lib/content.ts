import fs from "node:fs";
import path from "node:path";

// Nội dung chữ và đường dẫn ảnh lấy từ các frame Figma ghi trong DESIGN.md.

/**
 * Nút dưới phần mô tả. Không có `action` thì là link thường (chưa có `href` thì nút chưa bấm được).
 * - "issues": mở bảng đọc PDF các số báo trong `public/<issuesDir>/`; chưa có PDF thì mở `href` (thư mục Drive).
 * - "soundtrack": phát/dừng file nhạc `audio` của mục; chưa có file thì mở `href` (file Drive).
 */
export type ButtonDef = { label: string; href?: string; action?: "issues" | "soundtrack" };

/** Một số báo (PDF) hiện trong bảng đọc của mục CNN ZOOM. */
export type Issue = { title: string; pdf: string; cover?: string };

type ItemDef = {
  title: string;
  /** Các đoạn hiện dưới tiêu đề khi mục đang mở. */
  description?: string[];
  buttons?: ButtonDef[];
  /** Đường dẫn trong public/ của file nhạc (nút "soundtrack"). */
  audio?: string;
  /** Thư mục trong public/ chứa PDF các số báo (nút "issues"). */
  issuesDir?: string;
  /** Thư mục trong public/images/ chứa ảnh của mục này (xem docs/adding-images.md). */
  dir: string;
  /** object-position của ảnh đầu tiên, lấy theo vùng crop trong Figma. */
  focus?: string;
  /** Competition 2: ảnh nằm lọt trong nền trắng thay vì phủ kín. */
  inset?: boolean;
};

export type Item = Omit<ItemDef, "dir" | "audio" | "issuesDir"> & {
  /** Xếp theo tên file: ảnh đầu là ảnh trong frame Figma, tất cả cross-fade với nhau. */
  images: string[];
  /** Có giá trị khi file nhạc thật sự nằm trong public/. */
  audioSrc?: string;
  /** Có giá trị khi thư mục PDF có ít nhất một file. */
  issues?: Issue[];
};

type SectionDef = Omit<Section, "items"> & { items: ItemDef[] };

export type Section = {
  slug: string;
  title: string;
  tagline: string;
  /** Đơn vị design px. */
  titleWidth: number;
  listWidth: number;
  /** Khoảng cách từ tiêu đề đến mô tả, cỡ chữ và line-height của mô tả (design px). */
  descGap: number;
  descSize: number;
  descLeading: number;
  /** Mũi tên ở khối tiêu đề chuyển qua lại giữa 5 trang chính (about → … → community); trang cuối không có "→". */
  prev: string;
  next?: string;
  items: Item[];
};


const sections: SectionDef[] = [
  {
    slug: "competition",
    title: "Competition",
    tagline:
      "I’ve always been the kid questioning the whole world, immersing myself in the curiosity to untangle social puzzles.",
    titleWidth: 440,
    listWidth: 450,
    descGap: 25,
    descSize: 21.5,
    descLeading: 29,
    prev: "/about",
    next: "/performing",
    items: [
      {
        title: "Gold Award - World Invention Creativity Olympic 2026 (WICO 2026)",
        description: [
          "In the competition, we developed a compact device with helpful features aimed at supporting dyspnea patients, tackling the need for detailed information on air quality for specific areas, analysis of patients’ health and air quality, and assistance in locating the closest medical facilities when needed. Our solution promotes pollution awareness and enhances dyspnea patients’ health as well as convenience.",
        ],
        buttons: [
          {
            label: "WICO Certificate",
            href: "https://drive.google.com/file/d/1-d8Ozcnl4LcPxmRM0gJd4qUoViDAdg9t/view?usp=drive_link",
          },
        ],
        dir: "competition/1-wico",
        focus: "18.5% 50%",
      },
      {
        title: "International Invention Innovation Competition in Canada 2026 (iCAN 2026)",
        description: [
          "Popular media describe a resurgence of traditional, craft-related hobbies among younger consumers, a trend nicknamed “grannycore,” and claim such pursuits are displacing nightlife and screen time. Our study “The Grannycore Hypothesis” examines whether this cultural narrative leaves a measurable footprint in U.S. consumer spending behavior. Using monthly Federal Reserve Economic Data (FRED) from 2010 to 2026, we apply trend tests, STL decomposition, and cross-correlation to evaluate hobby-related retail sales. We conclude that aggregate population data do not corroborate a relative hobby resurgence or the displacement of nightlife.",
        ],
        buttons: [
          {
            label: "Grannycore Report",
            href: "https://drive.google.com/file/d/1fFNsiGkq66FAqoRj064f8UiHFkqDAgav/view",
          },
          {
            label: "iCAN Certificate",
            href: "https://drive.google.com/drive/folders/1fUa2whmlzWUZt430gYiBcCyO7eUbUxTQ?usp=sharing",
          },
        ],
        dir: "competition/2-ican",
        inset: true,
      },
      {
        title: "Best Vietnamese Presentation Award - High School Social Impact Challenge 2026",
        description: [
          "We promote MẦM (Mountainous Access to STEM Mentorship)—a project dedicated to introducing STEM to schools in the Northern Midlands and Mountainous region. By integrating AI with approved curricula, we aim to train enthusiastic, dedicated, and qualified educators capable of expanding and advancing STEM education.",
        ],
        dir: "competition/3-hssic",
        focus: "19.2% 50%",
      },
      {
        title: "4th Place - RMIT Tech Camp 2026",
        description: [
          "In this cybersecurity challenge, we step into the shoes of digital detectives to gather evidence to solve an investigation. Our primary objective is to locate and decode suspicious bank transaction details hidden within the computer's backup files.",
        ],
        dir: "competition/4-rmit",
      },
      {
        title: "Top 15 - Build@HUB Hackathon 2026",
        description: [
          "Observing the challenges faced by students and high schools in Vietnam, we integrated AI and technology to create Ed4U—a B2B2C EdTech platform providing the data infrastructure and institutional endorsement.",
        ],
        dir: "competition/5-buildhub",
      },
    ],
  },
  {
    slug: "performing",
    title: "Performing",
    tagline: "My heart has always found its home under the spotlight.",
    titleWidth: 287,
    listWidth: 420,
    descGap: 10,
    descSize: 23,
    descLeading: 32,
    prev: "/competition",
    next: "/culture-writing",
    items: [
      {
        title: "Thang Long Water Puppet Theater",
        description: [
          "Where the story begins... Thang Long Water Puppet Theatre is the only traditional arts venue in Vietnam to host water puppet shows 365 days a year. My signature performance is the 'Dance of the Four Holy Beasts'—a powerful symbol of the sacred, featuring the four mythical creatures of heaven and earth that bestow blessings of luck, prosperity, fidelity, and longevity.",
        ],
        dir: "performing/1-thang-long",
        focus: "50% 31.4%",
      },
      {
        title: "Vietnam Puppet Theater",
        description: [
          "The Vietnam Puppet Theater stands as the nation's largest sanctuary for puppetry, entrusted with the mission of preserving and elevating traditional stage arts. Here, I embraced the chance to challenge myself with performances that bridge tradition and modernity, merging the magic of water and land puppetry. Among these, bringing 'Andersen's Fairy Tales' to life for children remains my cherished milestone.",
        ],
        dir: "performing/2-vietnam-puppet",
      },
      {
        title: "Hanoi Cai Luong Theater",
        description: [
          "“Cai Luong” is a traditional form of Vietnamese musical theater, representing a distinctive cultural beauty in the spiritual life of our people. Unlike modern pop music, “Cai Luong” demands highly specialized vocal techniques—the application of melisma, where a single syllable is stretched over a complex run of notes or a resonant vibrato—to bring emotional depth and theatricality to every verse.",
        ],
        dir: "performing/3-cai-luong",
        focus: "0% 0%",
      },
      {
        title: "Little Sun Theater Troupe - \"Police Rabbit and the AI Tornado\"",
        description: [
          "Character: Sister Rainbow\nPlay: \"Police Rabbit and Tornado AI\"",
          "The play follows Fox, who dreams of becoming a police officer. When the kingdom is threatened by an evil force that steals a precious artifact, Fox steps forward with bravery, battling the villains and their manipulative “AI and technology” tactics. In the end, Fox is awarded and officially recognized as a policeman. The play features a modern, child-friendly tone, integrating educational messages about life skills, a sense of responsibility, proper conduct, and adaptability in the digital age.",
        ],
        dir: "performing/4-little-sun",
      },
    ],
  },
  {
    slug: "culture-writing",
    title: "Culture & Writing",
    tagline:
      "Life is always so vividly colorful, and a part of me belongs to these beautiful fragments. Off-stage, I pour my soul into every page.",
    titleWidth: 390,
    listWidth: 420,
    descGap: 10,
    descSize: 23,
    descLeading: 32,
    prev: "/performing",
    next: "/community-services",
    items: [
      {
        title: "GOm Show – The Sound of Ceramics",
        description: [
          "“When the clay awake and sing,\nAnd the earthen vessels ring.”",
          "GOm Show transforms clay, bamboo, and traditional indigenous instruments into a contemporary performance that brings the sounds, stories, and cultural spirit of local communities vividly to life",
        ],
        buttons: [{ label: "Visit the Website", href: "https://www.facebook.com/GOmShow/" }],
        dir: "culture-writing/1-gom-show",
        focus: "100% 50%",
      },
      {
        title: "CNN ZOOM",
        description: [
          "CNN Zoom is the official publication and the representative voice of the teachers and students at the Foreign Language Specialized School. Every year, thousands of copies are delivered to readers throughout Hanoi.",
        ],
        buttons: [
          { label: "Visit CNN ZOOM Website", href: "https://tinyurl.com/translayxudepraocanngonngu" },
          {
            label: "Explore",
            action: "issues",
            // Chưa có PDF trong public/zoom/ thì nút mở thư mục Drive này.
            href: "https://drive.google.com/drive/folders/1f4ImXz-Zxja_-K3ZXAYsAyr_T2xrXVco?usp=sharing",
          },
        ],
        issuesDir: "zoom",
        dir: "culture-writing/2-cnn-zoom",
      },
      {
        title: "Vibrant CNN Showcase – “A Midsummer Night’s Dream” by William Shakespeare",
        description: [
          "“Love looks not with the eyes, but with the mind–where moonlight fades and shadows take flight.”",
          "Reimagining Shakespeare’s whimsical Athenian woods, we transformed classic Elizabethan theatre into an immersive journey through shadow play, original choreography, and synchronized voiceovers. We spearheaded end-to-end stage management, breathing life into an enchanted dreamscape where reality and illusion intertwine.",
        ],
        buttons: [
          {
            label: "Soundtrack: A Midsummer Night’s Dream",
            action: "soundtrack",
            // Chưa có file nhạc trong public/audio/ thì nút mở file Drive này.
            href: "https://drive.google.com/file/d/1tPL4mRDNYtHluHlnUW0_Q_n_hBKJ61b2/view?usp=sharing",
          },
        ],
        audio: "/audio/a-midsummer-nights-dream.mp3",
        dir: "culture-writing/4-vibrant-cnn",
      },
      {
        title: "Life’s So Drama - On Stage 2024\n(Drama Show)",
        description: [
          "“Five thousand miles—the long road home. A world away, an endless lifetime”",
          "Set in distant Russia, the play “Five Thousand Miles” took nearly 1,000 spectators into the fates of those living far from home, following their poignant journey to find the true meaning of life.",
        ],
        dir: "culture-writing/3-life-so-drama",
      },
    ],
  },
  {
    slug: "community-services",
    title: "Community Services",
    tagline:
      "Legend has it that laughter is the best medicine. Nothing fills my heart quite like seeing others smile.",
    titleWidth: 287,
    listWidth: 420,
    descGap: 10,
    descSize: 23,
    descLeading: 32,
    prev: "/culture-writing",
    items: [
      {
        title: "The Up Project",
        description: [
          "The Up Project is a non-profit initiative run by high school students across Hanoi, driven by the mission of spreading technological access to highland children. Up brought me joy beyond words—woven into every lesson, every classroom, every journey afar, and every gift package we handed out.",
        ],
        dir: "community-services/1-up-project",
        focus: "83.6% 50%",
      },
      {
        title: "Scribbles Season 11",
        description: [
          "Scribbles is a social organization dedicated to raising community awareness and fostering the holistic development of children. We organize the Scribbles’ Tour & Exhibition—a series of interactive exhibitions and experiential events designed to deliver essential knowledge on nutrition and health while instilling traditional values in children across primary schools and social protection centers.",
        ],
        dir: "community-services/2-scribbles",
      },
      {
        title: "Nha Em Bakery",
        description: [
          "\"Dear you, on a gloomy rainy day,\"",
          "Nha Em—an online bakery combining artisanal desserts with personal storytelling through handwritten letter orders—is a labor of love, established in the summer of 2025. They say our greatest fear is failure, yet it is even more terrifying to look back on those “gloomy days” and regret how many opportunities we missed. At Nha Em, we strive to be a space where everyone can be listened to and empowered to take a step forward.",
        ],
        buttons: [{ label: "Visit Our Website", href: "http://nhaem.framer.website/" }],
        dir: "community-services/3-nha-em",
      },
      {
        title: "School Prom Event",
        description: [
          "The School Prom Event is an annual farewell celebration for 9th graders at Hanoi Star Primary and Secondary School—an opportunity for students to express themselves, show gratitude, and create lasting memories before closing this chapter of their youth.",
        ],
        dir: "community-services/4-school-prom",
      },
    ],
  },
];

/** Slugs in site navigation order (competition → community-services). */
export const sectionSlugs = sections.map((s) => s.slug);

const IMAGE_FILE = /\.(jpe?g|png|webp|avif)$/i;

// Đọc lúc render, nên thả ảnh vào thư mục là hiện luôn, không cần sửa code.
export function listImages(dir: string): string[] {
  const abs = path.join(process.cwd(), "public", "images", dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => IMAGE_FILE.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => `/images/${dir}/${f}`);
}

const COVER_FILE = IMAGE_FILE;

/** Tên file → tiêu đề hiển thị, vd "Issue 21 (2022) - Fiesta.pdf" → "Issue 21 (2022) - Fiesta". */
function issueTitle(file: string) {
  return file.replace(/\.pdf$/i, "").replace(/_/g, " ").trim();
}

// Đọc lúc render như listImages: thả PDF vào public/<dir>/ là hiện. Ảnh bìa (tùy chọn) là
// file ảnh cùng tên, vd "Issue 21.pdf" + "Issue 21.jpg".
export function listIssues(dir: string): Issue[] {
  const abs = path.join(process.cwd(), "public", dir);
  if (!fs.existsSync(abs)) return [];
  const files = fs.readdirSync(abs);
  const base = (f: string) => f.replace(/\.[^.]+$/, "");
  return files
    .filter((f) => /\.pdf$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => {
      const cover = files.find((c) => COVER_FILE.test(c) && base(c) === base(f));
      return {
        title: issueTitle(f),
        pdf: `/${dir}/${encodeURIComponent(f)}`,
        cover: cover ? `/${dir}/${encodeURIComponent(cover)}` : undefined,
      };
    });
}

function publicFileExists(src: string) {
  return fs.existsSync(path.join(process.cwd(), "public", src));
}

export function getSection(slug: string): Section {
  const s = sections.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown section: ${slug}`);
  return {
    ...s,
    items: s.items.map(({ dir, audio, issuesDir, ...item }) => {
      const issues = issuesDir ? listIssues(issuesDir) : [];
      return {
        ...item,
        images: listImages(dir),
        audioSrc: audio && publicFileExists(audio) ? audio : undefined,
        issues: issues.length > 0 ? issues : undefined,
      };
    }),
  };
}

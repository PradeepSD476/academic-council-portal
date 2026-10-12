import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Roadmaps & Chapters...');

  // Delete existing demo roadmaps for a clean seed
  await prisma.roadmap.deleteMany({
    where: { slug: { in: ['web-development', 'ai-ml-pathway'] } },
  });

  // 1. Full Stack Web Development Roadmap
  const webDev = await prisma.roadmap.create({
    data: {
      title: 'Full Stack Web Development',
      slug: 'web-development',
      description: 'Master modern frontend and backend development with Next.js, React, Node.js, and Databases.',
      domain: 'CS',
      icon: 'Code',
      isPublished: true,
      sections: {
        create: [
          {
            title: 'Foundations & Tooling',
            order: 1,
            chapters: {
              create: [
                {
                  title: 'Getting Started with Next.js',
                  slug: 'getting-started-nextjs',
                  order: 1,
                  duration: '10 mins',
                  content: `
<h1>Getting Started with Next.js</h1>

<p>Welcome to the <strong>Full Stack Web Development</strong> roadmap! In this chapter, you will learn how to create your first Next.js application using modern React standards.</p>

<h2>Creating a new project</h2>

<p>We recommend using <code>pnpm</code> or <code>npm</code> as your package manager. Run the following command in your terminal:</p>

<pre><code class="language-bash">npx create-next-app@latest my-app</code></pre>

<p>During installation, you will see the following prompts:</p>

<ul>
  <li>What is your project named? <code>my-app</code></li>
  <li>Would you like to use TypeScript? <code>Yes</code></li>
  <li>Would you like to use ESLint? <code>Yes</code></li>
  <li>Would you like to use Tailwind CSS? <code>Yes</code></li>
  <li>Would you like to use <code>src/</code> directory? <code>Yes</code></li>
  <li>Would you like to use App Router? <code>Yes</code></li>
</ul>

<h2>Project Structure Overview</h2>

<p>Next.js uses a file-system based router. Inside the <code>app/</code> folder, any <code>page.tsx</code> file automatically becomes an accessible URL route.</p>
                  `.trim(),
                },
                {
                  title: 'CSS Styling & Tailwind Architecture',
                  slug: 'css-styling-tailwind',
                  order: 2,
                  duration: '15 mins',
                  content: `
<h1>CSS Styling & Tailwind Architecture</h1>

<p>Tailwind CSS allows you to write utility-first CSS directly inside your markup for fast and scalable styling.</p>

<h2>Key Benefits of Utility-First CSS</h2>

<ul>
  <li><strong>No class name collisions:</strong> You don't need to invent arbitrary class names.</li>
  <li><strong>Consistent spacing & color tokens:</strong> Pre-configured theme scale keeps UI harmonious.</li>
  <li><strong>Responsive design out of the box:</strong> Prefix styles with <code>sm:</code>, <code>md:</code>, <code>lg:</code> easily.</li>
</ul>

<h2>Example Card Component</h2>

<pre><code class="language-jsx">&lt;div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4"&gt;
  &lt;div className="text-xl font-medium text-black"&gt;Tailwind Card&lt;/div&gt;
&lt;/div&gt;</code></pre>
                  `.trim(),
                },
              ],
            },
          },
          {
            title: 'Server Components & Data Fetching',
            order: 2,
            chapters: {
              create: [
                {
                  title: 'Server Components & Static Generation',
                  slug: 'server-components-data-fetching',
                  order: 1,
                  duration: '12 mins',
                  content: `
<h1>Server Components & Data Fetching</h1>

<p>React Server Components allow you to fetch data directly on the server before sending HTML to the client browser.</p>

<h2>Fetching Data in Server Components</h2>

<pre><code class="language-jsx">export default async function Page() {
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();

  return (
    &lt;main&gt;
      &lt;h1&gt;{data.title}&lt;/h1&gt;
    &lt;/main&gt;
  );
}</code></pre>
                  `.trim(),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 2. AI & Machine Learning Roadmap
  await prisma.roadmap.create({
    data: {
      title: 'AI & Machine Learning Pathway',
      slug: 'ai-ml-pathway',
      description: 'Comprehensive guide to Mathematics, Python, Deep Learning, and LLM Applications.',
      domain: 'AI',
      icon: 'Sparkles',
      isPublished: true,
      sections: {
        create: [
          {
            title: 'Mathematics & Python Foundations',
            order: 1,
            chapters: {
              create: [
                {
                  title: 'Linear Algebra & Calculus for ML',
                  slug: 'linear-algebra-calculus',
                  order: 1,
                  duration: '20 mins',
                  content: `
<h1>Linear Algebra & Calculus for ML</h1>

<p>Machine learning models rely heavily on matrix operations and gradient descent minimization techniques.</p>

<h2>Core Topics to Master</h2>

<ul>
  <li>Vector & Matrix Multiplication</li>
  <li>Eigenvalues & Eigenvectors (PCA)</li>
  <li>Partial Derivatives & Chain Rule (Backpropagation)</li>
</ul>
                  `.trim(),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Roadmaps seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding roadmaps:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

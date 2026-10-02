import { CONCEPTS } from '../content';

const ALGO = CONCEPTS.filter((c) => c.kind === 'algorithm').length;
const SYS = CONCEPTS.filter((c) => c.kind === 'systems').length;
const DS = CONCEPTS.length - ALGO - SYS;

/** First-visit guide: what you're learning, and how the app works. Also reachable from the map. */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome">
      <section className="panel">
        <h1>What you’re learning</h1>
        <p className="lead">
          <b>Data structures</b> are the ways programs organise data in memory so it can be used efficiently. A list of
          items, a queue of jobs, a phone book you can search instantly, a map of roads: each of these is a data structure.
          Choosing and understanding the right one is most of what separates code that is fast and simple from code that
          is slow and tangled.
        </p>
        <p>
          This course covers {DS} of them, from the very bottom (what memory actually is) up to advanced ones (like the
          structures inside databases and caches). You don’t need to write code here: the goal is to understand how each
          structure works, so well that you could rebuild it yourself.
        </p>
        <p>
          <b>Algorithms</b> are step-by-step methods that use those structures to solve problems: searching, sorting,
          finding shortest routes. The course has {ALGO} of them, woven into the same path. Each algorithm opens only after
          you’ve passed the data structures it uses, so you always learn the tool before the technique.
        </p>
        <p>
          There are also {SYS} <b>systems</b> lessons in five tracks: computer architecture (early on, right after arrays and
          lists), then operating systems, databases, networking and system design at the top of the path. They show the same structures at work in the real systems you’ll build on: a database index is a
          B+ tree, a cache is an LRU map, TCP’s window is a ring buffer, a rate limiter is a queue of timestamps.
        </p>

        <h2>The idea behind the whole course</h2>
        <p>
          Every data structure is built from just two things: <b>boxes side by side</b> (arrays) and <b>boxes that point to
          other boxes</b> (pointers), plus <b>one rule</b> the structure promises to keep. Once you see that, the {DS}{' '}
          structures stop being {DS} things to memorise and become variations on one idea.
        </p>

        <h2>The path</h2>
        <p>
          You start at the bottom and work up. Each lesson unlocks once you’ve passed the lessons it’s built on.
          The map shows the whole path, with what’s done, what’s open and what’s still locked.
        </p>

        <h2>How each lesson works</h2>
        <ol className="how-list">
          <li>
            <b>Learn:</b> a plain explanation of what it is, the problem it solves, and how it works step by step.
          </li>
          <li>
            <b>Try it:</b> an animation shows it working, step by step: values slide into place, pointers swing,
            trees rotate, with a sentence at each step saying what is happening and why. Some lessons then let you press
            the buttons yourself.
          </li>
          <li>
            <b>4 questions:</b> the same four questions for every structure (how it’s stored, its rule, what the rule makes
            fast, what it costs), and a matching four for every algorithm. Answer in your head, then reveal.
          </li>
          <li>
            <b>Checkpoint:</b> 8 questions of different kinds. Each question says at the top what it’s asking you to do.
            Get 6 right (not guessed) to pass and unlock what comes next.
          </li>
        </ol>

        <h2>Answering questions</h2>
        <ul>
          <li>
            Before you submit, you say how sure you are: <b>Guessing</b>, <b>Fairly sure</b> or <b>Certain</b>. Be honest:
            guesses never count as knowing it, and answers you were certain about but got wrong come back first.
          </li>
          <li>After every answer you see why it was right or wrong.</li>
          <li>
            <span className="term">Underlined words</span> can be tapped for a plain definition.
          </li>
        </ul>

        <h2>Making it stick</h2>
        <p>
          Passed lessons come back in <b>Review</b> as brand-new questions, spaced out over days. Getting every kind of
          question right on three separate days makes it <b>★ Mastered</b>. Miss it later and it goes back to
          practice. Doing a short review each day is the whole trick.
        </p>

        <h2>Then write it in C#</h2>
        <p>
          Once you pass a lesson, its Done page lists real LeetCode problems that use it. Solve them in C# on LeetCode, which
          checks your code with its own tests. This app gets you to “I know how to solve it”; those problems get you to
          “I can write it quickly”.
        </p>

        <button type="button" className="btn primary" onClick={onStart}>
          Go to the map →
        </button>
      </section>
    </div>
  );
}

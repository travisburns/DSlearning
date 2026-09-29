import { useEffect, useState } from 'react';
import type { Progress } from './engine/mastery';
import { emptyProgress, loadProgress, markLearned, recordAnswer, saveProgress } from './engine/mastery';
import { getConcept } from './content';
import { Home } from './ui/Home';
import { Lesson } from './ui/Lesson';
import { Review } from './ui/Review';
import { Stats } from './ui/Stats';

type Route = { page: 'home' } | { page: 'learn'; id: string } | { page: 'review' } | { page: 'stats' };

function parse(hash: string): Route {
  const [, page, id] = hash.replace(/^#/, '').split('/');
  if (page === 'learn' && id && getConcept(id)) return { page: 'learn', id };
  if (page === 'review') return { page: 'review' };
  if (page === 'stats') return { page: 'stats' };
  return { page: 'home' };
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => saveProgress(progress), [progress]);

  const go = (hash: string) => {
    location.hash = hash;
  };

  if (route.page === 'learn') {
    const concept = getConcept(route.id)!;
    return (
      <main className="wrap">
        <Lesson
          key={concept.id}
          concept={concept}
          onAnswer={(type, correct, conf) => setProgress((p) => recordAnswer(p, concept.id, type, correct, conf))}
          onFinish={() => setProgress((p) => markLearned(p, concept.id))}
          onExit={() => go('/')}
        />
      </main>
    );
  }

  if (route.page === 'review')
    return (
      <main className="wrap">
        <Review
          progress={progress}
          onAnswer={(concept, type, correct, conf) => setProgress((p) => recordAnswer(p, concept, type, correct, conf))}
          onExit={() => go('/')}
        />
      </main>
    );

  if (route.page === 'stats')
    return (
      <main className="wrap">
        <Stats progress={progress} onExit={() => go('/')} onLearn={(id) => go(`/learn/${id}`)} />
      </main>
    );

  return (
    <main className="wrap">
      <Home
        progress={progress}
        onLearn={(id) => go(`/learn/${id}`)}
        onReview={() => go('/review')}
        onStats={() => go('/stats')}
        onReset={() => setProgress(emptyProgress())}
      />
    </main>
  );
}

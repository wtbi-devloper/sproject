import HeroSection from '../components/HeroSection';
import StoryPreview from './sections/StoryPreview';
import DailyLogPreview from './sections/DailyLogPreview';
import PressPreview from './sections/PressPreview';
import ConnectPreview from './sections/ConnectPreview';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StoryPreview />
      <DailyLogPreview />
      <PressPreview />
      <ConnectPreview />
    </div>
  );
}

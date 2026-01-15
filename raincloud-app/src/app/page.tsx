import CRM from '../components/CRM';
import UserDataFetcher from '../components/UserDataFetcher';

export default function Home() {
  return (
    <div className="fade-in-up">
      <div className="text-center mb-8 fade-in-down">
        <h1 className="text-3xl font-mono font-semibold tracking-tight">
          RAINCLOUD_CRM
        </h1>
        <p className="text-zinc-500 font-mono text-sm mt-2 animate-stagger-1 fade-in-up">
          LIGHTWEIGHT_CONTACT_MANAGEMENT
        </p>
      </div>
      <div className="animate-stagger-2 fade-in-up">
        <CRM />
      </div>
      <div className="animate-stagger-3 fade-in-up">
        <UserDataFetcher />
      </div>
    </div>
  );
}

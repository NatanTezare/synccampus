import { RouteIcon } from './icons';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-24 px-6 rounded-2xl border border-dashed border-twilight-border bg-twilight-surface/40 animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-usiu-blue/15 border border-usiu-blue/30 flex items-center justify-center">
        <RouteIcon className="h-6 w-6 text-usiu-blue" />
      </div>
      <div>
        <p className="font-display font-semibold text-lg">{title}</p>
        <p className="text-sm text-alice-muted mt-1 max-w-xs">
          We're wiring this module up to the API next. Check back soon.
        </p>
      </div>
    </div>
  );
}

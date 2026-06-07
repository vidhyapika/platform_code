type LogoProps = {
  className?: string;
  variant?: 'header' | 'hero' | 'mark';
};

const LOGO_SRC = '/vidhyapika_one_line.png';

const VARIANT_CLASSES = {
  header: 'h-9 w-auto max-w-[180px] sm:max-w-[200px]',
  hero: 'h-12 sm:h-14 w-auto max-w-[240px]',
  mark: 'h-9 w-9 object-cover object-left',
} as const;

export function Logo({ className = '', variant = 'header' }: LogoProps) {
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="Vidhyapika"
        className={`object-contain ${VARIANT_CLASSES[variant]}`}
      />
    </div>
  );
}

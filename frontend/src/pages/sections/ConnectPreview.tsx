import useSocialLinks from '../../hooks/useSocialLinks';
import ContactForm from '../../components/ContactForm';

export default function ConnectPreview() {
  const { socialButtons, loading } = useSocialLinks();

  return (
    <section id="connect" className="scroll-mt-24 bg-[var(--brown)] py-20 lg:py-28 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[var(--gold)]/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[var(--gold)]/3 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--gold)]">
          <span className="inline-block h-px w-6 bg-[var(--gold)]" />
          Connect
        </div>
        {/* FIX 13: Rewrote heading — removes math-equation format, cleaner rhythm */}
        <h2 className="mt-3 font-['Playfair_Display'] text-3xl font-bold tracking-tight text-[var(--cream)] sm:text-4xl">
          Work Together
          <span className="text-[var(--gold)]"> · </span>
          Create Together
          <span className="text-[var(--gold)]"> · </span>
          Grow Together
          <br />
          <span className="text-[var(--gold)] italic">— That's how we build SUCCESS.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--cream)]/70">
          Whether it's a project, partnership, or just a conversation — I'd love to hear from you.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Social Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--cream)]">Find me on</h3>
            {loading ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-11 w-32 !bg-white/5 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {socialButtons.length > 0 ? (
                  socialButtons.map((s) => (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2.5 rounded-xl border border-[var(--cream)]/15 px-5 py-3 text-sm font-medium text-[var(--cream)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${s.hoverClass}`}
                    >
                      {s.icon}
                      {s.label}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-[var(--cream)]/50">Social links coming soon.</p>
                )}
              </div>
            )}
          </div>

          {/* FIX 14: Contact form gets a subtle card lift — makes it the primary CTA visually */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--cream)]">Send a Message</h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

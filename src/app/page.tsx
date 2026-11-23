import Image from "next/image";
import { ArrowDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ProcessRecords } from "@/components/process-records";
import { Button } from "@/components/ui/button";

const contactEmail = "luc@slashcreate.com";

const stages = [
  ["Enquiry", "#enquiry"],
  ["Manufacture", "#manufacture"],
  ["Inspection", "#inspection"],
  ["Delivery", "#delivery"],
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header" id="top">
        <nav className="shell nav" aria-label="Main navigation">
          <a className="wordmark" href="/" aria-label="/create homepage">
            <i aria-hidden="true" />create
          </a>
          <div className="nav-links">
            <a href="#process">The process</a>
            <a href="#inspection">Inspection</a>
          </div>
          <Button asChild className="action action-accent">
            <a href="#contact">Start an enquiry <ArrowUpRight aria-hidden="true" /></a>
          </Button>
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true">
            <Image src="/manufacturing/cnc-machining.webp" alt="" fill priority unoptimized />
          </div>
          <div className="shell hero-inner">
            <div className="hero-copy">
              <h1 id="hero-title">Actuator<br />assemblies<span>.</span></h1>
              <p>From drawing to delivery for defence programmes.</p>
              <Button asChild variant="ghost" className="action action-outline">
                <a href="#process">Follow the process <ArrowDownRight aria-hidden="true" /></a>
              </Button>
            </div>
          </div>
        </section>

        <nav id="process" className="process-nav" aria-label="Manufacturing process">
          <ol className="shell">
            {stages.map(([label, href]) => (
              <li key={href}>
                <a href={href}>{label}<ArrowDown aria-hidden="true" /></a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="chapter chapter-paper">
          <div className="shell chapter-lead enquiry-lead">
            <section id="enquiry" aria-labelledby="enquiry-title">
              <h2 id="enquiry-title"><span className="slash" aria-hidden="true" />Start with the drawing.</h2>
              <p>
                The drawing revision, order quantity and delivery date set the scope for a quote.
                If there’s a separate approval for the first build, agree who signs it off before
                scheduling repeat orders.
              </p>
            </section>
            <ProcessRecords />
          </div>

          <div className="shell editorial-pair">
            <section id="new-programmes" aria-labelledby="new-programmes-title">
              <h2 id="new-programmes-title">New programmes</h2>
              <p>
                Work back from the first delivery. The quote needs to say when the drawing will be
                ready, how many assemblies are needed, and whether the first batch is for evaluation
                or production.
              </p>
            </section>
            <section id="second-source" aria-labelledby="second-source-title">
              <h2 id="second-source-title">Second sourcing</h2>
              <p>
                Start with the current part number and drawing revision. Confirm which records can
                be shared with a second source, who approves the change and what evidence they
                need before placing an order.
              </p>
            </section>
          </div>
        </div>

        <div className="chapter chapter-shop">
          <section id="manufacture" className="shell" aria-labelledby="manufacture-title">
            <div className="chapter-lead">
              <h2 id="manufacture-title"><span className="slash" aria-hidden="true" />Build to the agreed revision.</h2>
              <p>
                Agree what ships as a complete assembly and what comes separately. The build
                follows the drawing revision on the order. If that changes, resolve what happens
                to work already under way before the new revision is released.
              </p>
            </div>
            <div className="product-image">
              <Image
                src="/manufacturing/linear-actuator.webp"
                width={1000}
                height={282}
                alt="Example Ultra Motion linear actuator with a cylindrical housing and mounting eyes"
                unoptimized
              />
            </div>
          </section>

          <div className="shell manufacturing-grid">
            <div className="detail-image machining-image">
              <Image
                src="/manufacturing/cnc-inside.webp"
                alt="A CNC probe above a machined metal workpiece"
                width={1250}
                height={969}
                unoptimized
              />
            </div>
            <div className="manufacturing-copy">
              <section id="uk-sourcing" aria-labelledby="uk-sourcing-title">
                <h2 id="uk-sourcing-title">UK sourcing</h2>
                <p>
                  Set out which work needs to take place in the UK and which suppliers need
                  approval. Agree that scope before the order so it carries through to the
                  records that accompany delivery.
                </p>
              </section>
              <section id="repeat-orders" aria-labelledby="repeat-orders-title">
                <h2 id="repeat-orders-title">First build, then repeat</h2>
                <p>
                  The first build has its own quantity, date and approval requirements. Once
                  that batch is accepted, the repeat schedule can set out batch sizes and
                  delivery dates against the agreed revision.
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="chapter chapter-paper">
          <section id="inspection" className="shell chapter-lead inspection" aria-labelledby="inspection-title">
            <div>
              <h2 id="inspection-title"><span className="slash" aria-hidden="true" />Inspect before release.</h2>
              <p>
                Before the build, agree what receiving inspection needs. The first delivery may
                need a dimensional report. Repeat deliveries may need a certificate of conformity.
                Resolve any open deviations before release.
              </p>
            </div>
            <div className="detail-image inspection-image">
              <Image
                src="/manufacturing/dimensional-inspection.webp"
                width={1400}
                height={933}
                alt="Hands measuring a metal component with a digital calliper"
                unoptimized
              />
            </div>
          </section>

          <div className="shell editorial-pair">
            <section id="traceability" aria-labelledby="traceability-title">
              <h2 id="traceability-title">Tie the records to the part</h2>
              <p>
                A serial number or batch reference links the assembly to its drawing revision,
                component lots and inspection records. Agree which records need to travel with
                the assembly and which can be retained against the order.
              </p>
            </section>
            <section id="delivery" aria-labelledby="delivery-title">
              <h2 id="delivery-title">Release the delivery</h2>
              <p>
                The delivery note identifies the part, revision and quantity. The agreed
                acceptance records go with it, so goods-in can match the hardware to the
                purchase order and close out the delivery.
              </p>
            </section>
          </div>
        </div>

        <div className="chapter chapter-contact">
          <div className="shell editorial-pair enquiry-pair">
            <section id="first-enquiry" aria-labelledby="first-enquiry-title">
              <h2 id="first-enquiry-title">What to send first</h2>
              <ul>
                <li>Your organisation and what you need</li>
                <li>Indicative quantities and the first delivery date</li>
                <li>Any mandatory approvals or UK sourcing requirements</li>
              </ul>
            </section>
            <section id="suppliers" aria-labelledby="suppliers-title">
              <h2 id="suppliers-title">Supplier enquiries</h2>
              <p>
                If you supply machining, finishing or inspection, send your UK site location,
                the work you take on, typical batch sizes and any relevant approvals.
              </p>
            </section>
          </div>

          <section id="contact" className="contact" aria-labelledby="contact-title">
            <div className="shell contact-inner">
              <div>
                <h2 id="contact-title">Start an enquiry.</h2>
                <p>Keep the first email to a non-sensitive summary.</p>
              </div>
              <Button asChild className="action action-dark">
                <a href={`mailto:${contactEmail}`}>
                  {contactEmail} <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <a className="wordmark" href="/" aria-label="/create homepage">
            <i aria-hidden="true" />create
          </a>
          <span>United Kingdom</span>
          <div className="footer-links">
            <details className="photo-credits">
              <summary>Photo credits</summary>
              <p>
                Illustrative actuator by Ultra Motion,{" "}
                <a href="https://commons.wikimedia.org/wiki/File:Underwater_Linear_Actuator.png">photo by JakeUM</a>
                {" · "}<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>
                {" · "}Converted to WebP.
              </p>
            </details>
            <a href="#top">Back to top</a>
          </div>
        </div>
      </footer>
    </>
  );
}

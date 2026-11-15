# Judge rubric

Score each criterion 0–4. 0 = absent or wrong, 1 = present but generic, 2 = adequate,
3 = good and specific to this product, 4 = a senior practitioner would sign it as is.
Grade what is written, not what could be inferred. Length earns nothing.

| id | Criterion | What a 4 looks like |
|---|---|---|
| problem | Problem framing | The brief states who has the problem and what it costs them, without presupposing the solution; assumptions are labelled as assumptions. |
| scope | MVP discipline | The MVP is visibly smaller than the vision; "later" items are listed with the reason they can wait; nothing in the MVP lacks a goal. |
| testable | Testable requirements | Every FR has acceptance criteria a tester could execute without asking a question; every NFR has a number and a way to verify it. |
| consistent | Consistency | Brief, PRD, UX spec, architecture and stories agree with each other on names, scope and behaviour. No contradictions. |
| ux | UX completeness | Every user-facing requirement has a flow and screens with empty, loading and error states, real copy, and accessibility handled concretely. |
| arch_fit | Architecture fits the requirements | Technology and structure follow from the NFR numbers and constraints; nothing is over-built for the stated scale; trade-offs are named. |
| arch_ops | Operability | Security, observability, deployment and rollback are designed concretely, not deferred to "later" or left as headings. |
| decisions | Decision records | ADRs name real alternatives and say why they lost; consequences include what gets harder. |
| stories | Story self-containment | A developer could implement each sampled story from its file alone: data shapes, contracts, error behaviour, files to touch, test notes. |
| honesty | Honest uncertainty | Unknowns appear as open questions or labelled assumptions rather than confident invention; no fabricated statistics or sources. |

# Interface Audit — Vaultarr 1.8.4

## Audit goals

1. Keep page styling cohesive with the Vaultarr blue museum theme.
2. Make equivalent buttons use equivalent dimensions and states.
3. Preserve special-purpose controls such as floating game cards, tabs, close controls, and the Museum Scan pill.
4. Confirm that active links and forms target registered routes.
5. Avoid changing the protected 1.5.8 UX baseline.

## Shared control standard

- Standard action height: 44 px
- Compact action height: 36 px
- Standard field height: 46 px
- Standard action radius: 13 px
- Standard action-group gap: 12 px
- Disabled actions have an explicit noninteractive state
- Keyboard focus uses the current theme accent

## Page findings

- Home and Museum already use the strongest shared layout system; button dimensions were normalized without altering card motion.
- Discover and Time Capsule had mixed legacy button sizing; shared action sizing now aligns their controls.
- Milestones audio controls remain intentionally compact, while page CTAs use the standard action size.
- Settings contained the largest mix of implicit submit buttons and page-specific action rows; submit intent and spacing are now explicit.
- Game Record forms now identify submit buttons explicitly and align acquisition/metadata actions consistently.
- Universal Search and Focus Mode retain their purpose-built controls, with close buttons and disabled links normalized.
- Retired Preservation and Activity routes remain compatibility redirects and are not presented as active pages.

## Functional checks

The release validation script checks:

- Flask rendering for active pages
- registered internal GET links
- registered form actions and supported HTTP methods
- Jinja parsing
- Python compilation
- JavaScript syntax

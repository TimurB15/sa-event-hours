# Design references and decisions

The original SA monogram and floral logo remain the app icon, launch artwork and header identity. Hebrew RTL, quiet surfaces, large tap targets, a floating five-tab bar, restrained motion, safe areas, skeletons and system-font fallbacks make the everyday workflow readable on iPhone.

References reviewed, with no third-party source copied:

| Reference | Applied or reserved use |
| --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Neutral surface tokens, consistent field/button/card patterns, bottom sheets, focus treatment |
| [Penpot](https://github.com/penpot/penpot) | Reusable spacing, typography and component tokens; no hosted service required |
| [Reactive Resume](https://github.com/reactive-resume/reactive-resume) | Clear report hierarchy, print styling, concise summary blocks |
| [Loadable Components](https://github.com/gregberge/loadable-components) | Route splitting and explicit loading fallbacks; React.lazy/Suspense avoids an extra loader dependency |
| [Lottie iOS](https://github.com/airbnb/lottie-ios) | Optional future branded success animation; currently lightweight motion respects Reduce Motion |
| [Spline iOS](https://github.com/splinetool/spline-ios) | Reference only, reserved for optional introductory visuals, not daily job controls |
| [Macaw](https://github.com/exyte/Macaw) | Vector/icon reference; current SVG/Lucide assets work across web and both mobile targets |

Native Swift-only animation libraries are not required by the shared Capacitor view layer. Avoid shipping unused libraries or battery-heavy 3D scenes just because they were named as references.

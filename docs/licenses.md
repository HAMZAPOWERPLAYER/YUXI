# Open-Source Licenses

Yuxi is built with open-source software and bundles three open-source font families.
This document records the licenses that apply to the app and its dependencies. The
in-app **Settings → Open-source licenses** screen shows the generated package list.

The machine-readable list is `src/generated/licenses.json`, produced by:

```bash
npm run licenses
```

The generator reads production dependencies from `package.json`, reads each installed
package's `license` field, and adds the three bundled font entries. Re-run it whenever
dependencies change.

## Application license

The Yuxi application source is licensed under the **Apache License, Version 2.0**
(Apache-2.0). The full license text is in [`LICENSE`](../LICENSE), and the current
copyright attribution is in [`NOTICE`](../NOTICE).

Copyright (c) 2026 Yuxi contributors.

Apache-2.0 permits use, reproduction, modification, distribution, public display,
public performance, sublicensing and patent use under its terms, provided that the
license, copyright, patent, trademark and attribution notices are preserved. It also
includes an express patent grant and a trademark clause. This paragraph is a summary,
not legal advice; `LICENSE` is the controlling text.

## Bundled fonts

| Font               | Files                                                                      | License     | Copyright                                                                                                 |
| ------------------ | -------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| Noto Sans JP       | `@expo-google-fonts/noto-sans-jp` 400, 500 and 700 (bundled into the app)  | SIL OFL 1.1 | Copyright 2014–2021 Adobe (http://www.adobe.com/), with Reserved Font Name "Source"; Noto Project Authors |
| Noto Nastaliq Urdu | `@expo-google-fonts/noto-nastaliq-urdu` 400 and 700 (bundled into the app) | SIL OFL 1.1 | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/nastaliq)                           |
| Nunito             | `@expo-google-fonts/nunito` 600 and 800 (bundled into the app)             | SIL OFL 1.1 | Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)                         |

The three `@expo-google-fonts/*` packages are MIT-licensed wrappers published by Expo;
the font files themselves are OFL-1.1. The OFL text below applies to all three font
families.

## Dependency license summary

All production dependencies currently resolve to MIT, except the three font packages
(`MIT AND OFL-1.1`) and the three bundled fonts (`OFL-1.1`). The exact list at the time
of writing:

| Package                                  | Version | License         |
| ---------------------------------------- | ------- | --------------- |
| `@expo-google-fonts/noto-nastaliq-urdu`  | 0.4.2   | MIT AND OFL-1.1 |
| `@expo-google-fonts/noto-sans-jp`        | 0.4.4   | MIT AND OFL-1.1 |
| `@expo-google-fonts/nunito`              | 0.4.2   | MIT AND OFL-1.1 |
| `@expo/vector-icons`                     | 15.1.1  | MIT             |
| `@react-native-community/datetimepicker` | 9.2.1   | MIT             |
| `expo`                                   | 58.0.19 | MIT             |
| `expo-constants`                         | 58.0.13 | MIT             |
| `expo-device`                            | 58.0.5  | MIT             |
| `expo-document-picker`                   | 58.0.4  | MIT             |
| `expo-file-system`                       | 58.0.11 | MIT             |
| `expo-font`                              | 58.0.10 | MIT             |
| `expo-haptics`                           | 58.0.7  | MIT             |
| `expo-linking`                           | 58.0.14 | MIT             |
| `expo-localization`                      | 58.0.5  | MIT             |
| `expo-notifications`                     | 58.1.6  | MIT             |
| `expo-router`                            | 58.0.26 | MIT             |
| `expo-sharing`                           | 58.0.20 | MIT             |
| `expo-speech`                            | 58.0.3  | MIT             |
| `expo-splash-screen`                     | 58.0.11 | MIT             |
| `expo-sqlite`                            | 58.0.14 | MIT             |
| `expo-status-bar`                        | 58.0.4  | MIT             |
| `expo-system-ui`                         | 58.0.6  | MIT             |
| `react`                                  | 19.3.0  | MIT             |
| `react-dom`                              | 19.3.0  | MIT             |
| `react-native`                           | 0.88.0  | MIT             |
| `react-native-gesture-handler`           | 3.3.0   | MIT             |
| `react-native-reanimated`                | 4.7.1   | MIT             |
| `react-native-safe-area-context`         | 5.10.1  | MIT             |
| `react-native-screens`                   | 4.30.0  | MIT             |
| `react-native-svg`                       | 15.16.0 | MIT             |
| `react-native-web`                       | 0.21.4  | MIT             |
| `react-native-worklets`                  | 0.13.0  | MIT             |
| `zod`                                    | 4.6.7   | MIT             |
| Noto Nastaliq Urdu                       | bundled | OFL-1.1         |
| Noto Sans JP                             | bundled | OFL-1.1         |
| Nunito                                   | bundled | OFL-1.1         |

Transitive dependency license files remain in `node_modules` and in the published
packages. The generated list covers the direct production dependencies that the app
imports or bundles.

## SIL Open Font License 1.1

```text
Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'
Copyright 2022 The Noto Project Authors (https://github.com/notofonts/nastaliq)
Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Reporting a licensing issue

If you believe a license notice is missing or incorrect, contact
**hamzapowerplayer.global@gmail.com** with the package name and version. The packaged
license files in `node_modules` and the upstream repositories are the authoritative
source for each dependency.

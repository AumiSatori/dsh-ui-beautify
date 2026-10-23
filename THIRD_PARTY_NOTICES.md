# Third-party notices

## Optional whale-girl context background

`assets/context-whale.jpg` and its transparent foreground adaptation
`assets/context-whale-cutout.png` use the supplied DeepSeek girl illustration by
ZipZipPipe, based on the original character 溟月 by 上善无形. The supplied
character-reference package identifies it as CC BY-NC-SA 4.0:
https://creativecommons.org/licenses/by-nc-sa/4.0/

The original raster, its foreground extraction, sampled point cloud and detail
rendering retain this attribution and the same noncommercial share-alike terms.
They are not covered by this repository's MIT license. This optional asset is
for personal noncommercial use. The plugin defaults to DeepSeek's Logo geometry
provided at runtime by the host's public FishLogo primitive; the host Logo is
not re-created or copied into this source tree.

Custom SVG artwork stays in the current browser's local storage and is not
distributed with the plugin.

The Liquid Glass surface adapts SVG displacement-map and rounded-rectangle
distance-field techniques from the following MIT-licensed projects. The DSH
integration uses a bounded, edge-only map and keeps foreground content separate.
This file, including both copyright and permission notices below, is distributed
with the plugin.

- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react), revision
  `ac48eab18d1f7f444ae30002d240cae29c863a21`.
- [shuding/liquid-glass](https://github.com/shuding/liquid-glass), revision
  `a2d2e847f793430e3409a52927af815a23f4d372` (the upstream source credited by rdev).

The implementation generates its SVG filters and displacement maps locally; it
adds no runtime package dependency and loads no remote scripts, images or fonts.
No Apple code, brand assets or demonstration photographs are included. The
visual treatment is an approximation for the DSH web interface, with a
transparent-highlight fallback where SVG backdrop filtering is unavailable.
This independently maintained plugin is distributed under the MIT license in
LICENSE; the upstream notices follow in full.

## Lightweight CSS surface

The separate lightweight CSS material is independently authored using the
plugin's own material properties, gradients and inset highlights. Its visual
inspiration includes greyd097/yzrt's public CSS glass demonstration:
https://gitee.com/greyd097/yzrt/tree/master/
No source code from that project is included in this distribution.

## Smooth option switching reference

The sidebar material selector and navigation highlight independently adapt the
persistent-indicator and reversible-transition principles described by
https://github.com/zhoulinhua0-star/smooth-option-switcher (MIT original guidance).
No canonical video reconstruction, example source or other third-party code from
that repository is distributed here. The sidebar controls retain this plugin's
own material palette, layout, semantics and motion settings.

## Lens button optics

Lens WebGL2 rendering modules are vendored unmodified from
https://github.com/ruiqichenbiec/design-systems at revision
`7a424c93b9be13cf835b91ea67495fec2ec0584e` (MIT).
The local adapter uses their clear optical surface only on input action rims.
Its scene samples local computed background colors; the center stays transparent.
It does not capture chat text, drafts, images, video or arbitrary DOM pixels.
`src/lens-actions.js` and these modules are bundled into `client.js` by
`scripts/build-lens.mjs`. Full license: `vendor/lens/LICENSE`, included in the
distributed package. Copyright (c) 2026 DayDreamInAReverie.

## Liquid Glass React

Copyright 2025 MAX ROVENSKY

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in the
Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Liquid Glass

MIT License

Copyright (c) 2025 Shu Ding

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in the
Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

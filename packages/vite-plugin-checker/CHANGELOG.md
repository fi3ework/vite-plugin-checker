# 0.2.0-beta.0 (2021-06-30)


### Bug Fixes

* clean dead logic ([f88fd86](https://github.com/fi3ework/vite-plugin-checker/commit/f88fd866503ecc7fbe2ed6e16e7aaa9a14e0ce84))
* kill worker in build mode ([e7810f0](https://github.com/fi3ework/vite-plugin-checker/commit/e7810f0f76ffa6963e26cd8d51f981e6678ab841))
* make enableBuild works ([556db26](https://github.com/fi3ework/vite-plugin-checker/commit/556db26ab0ccde3a95bf7b29d1a40048829afce9))
* worker forever hang ([b5e159f](https://github.com/fi3ework/vite-plugin-checker/commit/b5e159f35bc093c66bb5724eadfede55e368d1c3))


### Features

* support arbitrary key for custom check ([#12](https://github.com/fi3ework/vite-plugin-checker/issues/12)) ([fc14b05](https://github.com/fi3ework/vite-plugin-checker/commit/fc14b05ce1c29e3ac84352397732f89e19c31a85))



# 0.1.0 (2021-06-14)


### Bug Fixes

* checker uses config right ([293f261](https://github.com/fi3ework/vite-plugin-checker/commit/293f2611b80556b7a4c2304cea7dee6a0651ba15))
* clean previous console ([fa47e77](https://github.com/fi3ework/vite-plugin-checker/commit/fa47e7707421f5a90d8bdcf871160bd5632e040c))
* support spawn in Windows ([5322714](https://github.com/fi3ework/vite-plugin-checker/commit/53227147b07284ac335123750c75ea5b6519d85a))



# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.1.0](https://github.com/fi3ework/vite-plugin-checker/compare/v0.1.0-beta.3...v0.1.0) (2021-06-14)

## [0.1.0-beta.3](https://github.com/fi3ework/vite-plugin-checker/compare/v0.1.0-beta.2...v0.1.0-beta.3) (2021-06-13)

## 0.1.0-beta.2 (2021-06-13)


### Features

* can log out to stdout ([dde7cd7](https://github.com/fi3ework/vite-plugin-checker/commit/dde7cd75eb0442f1bd38d54f5917c63cd4466cae))
* can show client side overlay ([af77873](https://github.com/fi3ework/vite-plugin-checker/commit/af778735d2223b3194ec3bdf96f9d17deb5331b0))
* display code frame ([9a9eca8](https://github.com/fi3ework/vite-plugin-checker/commit/9a9eca868bc0fffe1019a347b871cf859b50f366))
* run checker in worker thread ([c37097f](https://github.com/fi3ework/vite-plugin-checker/commit/c37097f3ea54ea26b743347e6a7e162033d4f639))
* run VLS in dev mode ([cf16f1b](https://github.com/fi3ework/vite-plugin-checker/commit/cf16f1b5f7808c2e01cac030ab6a25f1b512ecf4))
* stdout formatted ts diagnostics ([96453a5](https://github.com/fi3ework/vite-plugin-checker/commit/96453a56c934ccba513e2d10c400b2b6ca0b61cc))
* support for running muliple checks in parallel ([2588205](https://github.com/fi3ework/vite-plugin-checker/commit/258820515fc4cf543d5c72c80766dcaccec892a2))
* support read configs ([1cde236](https://github.com/fi3ework/vite-plugin-checker/commit/1cde236afcfc2f90cc1a113634f00a714e3c8cfd))
* **vls:** console error when dev ([1f9699c](https://github.com/fi3ework/vite-plugin-checker/commit/1f9699c560d0687f2db7fa9994f7b2326ae2a5d6))
* **vls:** run VLS in worker thread ([5d8f8a8](https://github.com/fi3ework/vite-plugin-checker/commit/5d8f8a8c99f3446d22515ce21ece0e0bb0dc55c2))
* support custom tsconfig ([6bfd83b](https://github.com/fi3ework/vite-plugin-checker/commit/6bfd83bdc4cbb39dbea13712e638030229bf9d28))
* support VLS in dev mode ([b96204a](https://github.com/fi3ework/vite-plugin-checker/commit/b96204a42472edb3a53a38951e5dd8bab6f47c1b))
* **vue2:** add vti check command ([eeaf1d5](https://github.com/fi3ework/vite-plugin-checker/commit/eeaf1d5f9b15aa57340286a091fb0caa40c03768))
* add react-example ([be8ea9b](https://github.com/fi3ework/vite-plugin-checker/commit/be8ea9b5ecd7d56b7553aa830a3dfd12389c0419))
* add vue-tsc example ([17d5d3b](https://github.com/fi3ework/vite-plugin-checker/commit/17d5d3b9233f3e6945349c3ab4c577dc2595f1c1))
* show formatted frame ([4025c4f](https://github.com/fi3ework/vite-plugin-checker/commit/4025c4f5d1e0275a31da69c27c7b19676871a6ad))
* show overlay error under API mode ([2ace313](https://github.com/fi3ework/vite-plugin-checker/commit/2ace313b546416382d4b2d608d0ff608184cf11c))
* support programmatic type check ([5231531](https://github.com/fi3ework/vite-plugin-checker/commit/5231531d3e805e72346a32bd075eddaccd28d962))
* work in buld mode ([88c3662](https://github.com/fi3ework/vite-plugin-checker/commit/88c3662eee95c5b21b77c2106b337238bc021303))


### Bug Fixes

* **vls:** clean previous console ([c9f02c1](https://github.com/fi3ework/vite-plugin-checker/commit/c9f02c169c889138b27b081f4d72f28531aabffc))
* **vls:** suppress extra log when VLS initial report ([4918762](https://github.com/fi3ework/vite-plugin-checker/commit/4918762f027703fbff6b7bf8443789825da5279d))
* add simple vue-tsc ([126b433](https://github.com/fi3ework/vite-plugin-checker/commit/126b4339a4353d05302fabb499b1cce236c8e855))
* checker can read shared and own config ([a906e83](https://github.com/fi3ework/vite-plugin-checker/commit/a906e83dc83557be793134d13880667e478ddfe4))
* checker uses config right ([fe6fe37](https://github.com/fi3ework/vite-plugin-checker/commit/fe6fe376a55e4333a726d204e1d6361a6c400de7))
* clean previous console ([4cc92a6](https://github.com/fi3ework/vite-plugin-checker/commit/4cc92a68c3d0c29481b3aeeb8f3f4896b8154b29))
* ensure stdout after clear screen ([aa24643](https://github.com/fi3ework/vite-plugin-checker/commit/aa246435edd8957fb7df288c936a80afdf1d51ef))
* lockfile registry ([028c4ab](https://github.com/fi3ework/vite-plugin-checker/commit/028c4ab4ea604a484fcf12f398670b24e2b88077))
* should use config ([5ce19ec](https://github.com/fi3ework/vite-plugin-checker/commit/5ce19ecd07765eaf0a72215d3cae705df0789faa))
* support spawn in Windows ([4103b1c](https://github.com/fi3ework/vite-plugin-checker/commit/4103b1ce18c2c92cfdd98b660250ad30a3e2b165))
* support Windows batch file ([f1c7d25](https://github.com/fi3ework/vite-plugin-checker/commit/f1c7d25b112956dbb0d318ce84f1a635f3e93066))
* use abs file path as error ID ([fdc0360](https://github.com/fi3ework/vite-plugin-checker/commit/fdc0360e990a5447a919e76a58ef2745c80d9344))

## [0.1.0-beta.1](https://github.com/fi3ework/vite-plugin-checker/compare/v0.1.0-beta.0...v0.1.0-beta.1) (2021-06-10)


### Bug Fixes

* checker uses config right ([62e8f5c](https://github.com/fi3ework/vite-plugin-checker/commit/62e8f5c6c474cf43a53f944bfd6c085a23a86218))

## 0.1.0-beta.0 (2021-06-09)


### Features

* can log out to stdout ([dde7cd7](https://github.com/fi3ework/vite-plugin-checker/commit/dde7cd75eb0442f1bd38d54f5917c63cd4466cae))
* can show client side overlay ([af77873](https://github.com/fi3ework/vite-plugin-checker/commit/af778735d2223b3194ec3bdf96f9d17deb5331b0))
* display code frame ([9a9eca8](https://github.com/fi3ework/vite-plugin-checker/commit/9a9eca868bc0fffe1019a347b871cf859b50f366))
* run checker in worker thread ([20702c8](https://github.com/fi3ework/vite-plugin-checker/commit/20702c82604e35e46c88d95dc15972f2f0c07078))
* run VLS in dev mode ([6bc50c1](https://github.com/fi3ework/vite-plugin-checker/commit/6bc50c1b2b1baf2978398e12520e829dc8500093))
* stdout formatted ts diagnostics ([96453a5](https://github.com/fi3ework/vite-plugin-checker/commit/96453a56c934ccba513e2d10c400b2b6ca0b61cc))
* support for running muliple checks in parallel ([34f68b2](https://github.com/fi3ework/vite-plugin-checker/commit/34f68b218c12691bb82b8a6f388990f11506a027))
* support read configs ([8bdf6e6](https://github.com/fi3ework/vite-plugin-checker/commit/8bdf6e6e4b0ee7cfc1ed1fce9d2a4428000074a7))
* **vls:** console error when dev ([8fec0ca](https://github.com/fi3ework/vite-plugin-checker/commit/8fec0ca1686057d95f144a7dcc1c0abf8f0f325d))
* **vls:** run VLS in worker thread ([276cc41](https://github.com/fi3ework/vite-plugin-checker/commit/276cc4149a50715da3011c34cd99ad130117c2eb))
* support custom tsconfig ([6bfd83b](https://github.com/fi3ework/vite-plugin-checker/commit/6bfd83bdc4cbb39dbea13712e638030229bf9d28))
* support VLS in dev mode ([3e151cf](https://github.com/fi3ework/vite-plugin-checker/commit/3e151cf72226c0611514d29d4f7db59760ea63d7))
* **vue2:** add vti check command ([de9f7f0](https://github.com/fi3ework/vite-plugin-checker/commit/de9f7f0f55868bf1d18c1992fa8b43638fa53c66))
* add react-example ([be8ea9b](https://github.com/fi3ework/vite-plugin-checker/commit/be8ea9b5ecd7d56b7553aa830a3dfd12389c0419))
* add vue-tsc example ([17d5d3b](https://github.com/fi3ework/vite-plugin-checker/commit/17d5d3b9233f3e6945349c3ab4c577dc2595f1c1))
* show formatted frame ([4025c4f](https://github.com/fi3ework/vite-plugin-checker/commit/4025c4f5d1e0275a31da69c27c7b19676871a6ad))
* show overlay error under API mode ([2ace313](https://github.com/fi3ework/vite-plugin-checker/commit/2ace313b546416382d4b2d608d0ff608184cf11c))
* support programmatic type check ([5231531](https://github.com/fi3ework/vite-plugin-checker/commit/5231531d3e805e72346a32bd075eddaccd28d962))
* work in buld mode ([88c3662](https://github.com/fi3ework/vite-plugin-checker/commit/88c3662eee95c5b21b77c2106b337238bc021303))


### Bug Fixes

* add simple vue-tsc ([fdb56be](https://github.com/fi3ework/vite-plugin-checker/commit/fdb56be2a35a87e55d0ce52ba1c338c79d8b1afb))
* checker can read shared and own config ([088a8bd](https://github.com/fi3ework/vite-plugin-checker/commit/088a8bd21b5421a609a65f8fdb6e3d6498ddeba3))
* ensure stdout after clear screen ([aa24643](https://github.com/fi3ework/vite-plugin-checker/commit/aa246435edd8957fb7df288c936a80afdf1d51ef))
* lockfile registry ([028c4ab](https://github.com/fi3ework/vite-plugin-checker/commit/028c4ab4ea604a484fcf12f398670b24e2b88077))
* use abs file path as error ID ([2150ddd](https://github.com/fi3ework/vite-plugin-checker/commit/2150ddd40a462d462db3ed18b11b7e23b5b016ab))

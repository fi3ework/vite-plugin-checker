## <small>0.4.6 (2022-04-14)</small>

* fix: runtime path should consider base (#135) ([356b664](https://github.com/fi3ework/vite-plugin-checker/commit/356b664)), closes [#135](https://github.com/fi3ework/vite-plugin-checker/issues/135)
* feat: support show rule ID for ESLint (resolve #132) ([5d9ef30](https://github.com/fi3ework/vite-plugin-checker/commit/5d9ef30)), closes [#132](https://github.com/fi3ework/vite-plugin-checker/issues/132)



## <small>0.4.5 (2022-04-05)</small>

* build: compatible with ESM import ([922ac6d](https://github.com/fi3ework/vite-plugin-checker/commit/922ac6d))



## <small>0.4.4 (2022-03-24)</small>

* fix: add vue-tsc resolved path flag ([7c4d97f](https://github.com/fi3ework/vite-plugin-checker/commit/7c4d97f))
* fix: svelte whitespace minification ([c136c43](https://github.com/fi3ework/vite-plugin-checker/commit/c136c43))
* fix(vue-tsc): runtime error UI ([6c561e8](https://github.com/fi3ework/vite-plugin-checker/commit/6c561e8))
* build: exclude vue-tsc-typescript fixtures ([740cedf](https://github.com/fi3ework/vite-plugin-checker/commit/740cedf))
* build: fix typescript version of vls ([4769045](https://github.com/fi3ework/vite-plugin-checker/commit/4769045))
* refactor: fix lint ([996f6a7](https://github.com/fi3ework/vite-plugin-checker/commit/996f6a7))
* test: add test for vue-tsc ([e46d327](https://github.com/fi3ework/vite-plugin-checker/commit/e46d327))
* feat: support vue-tsc watch mode ([6871f55](https://github.com/fi3ework/vite-plugin-checker/commit/6871f55))



## <small>0.4.3 (2022-03-13)</small>

* feat: support customized config.server.hmr (fix #119) ([c1bfa21](https://github.com/fi3ework/vite-plugin-checker/commit/c1bfa21)), closes [#119](https://github.com/fi3ework/vite-plugin-checker/issues/119)
* chore: bump playwright-chromium for macos 12 ([2dd7406](https://github.com/fi3ework/vite-plugin-checker/commit/2dd7406))



## <small>0.4.2 (2022-02-12)</small>

* test: add case for no runtime code in build ([0a7a1e7](https://github.com/fi3ework/vite-plugin-checker/commit/0a7a1e7))
* test: update snapshot ([d1b6c0f](https://github.com/fi3ework/vite-plugin-checker/commit/d1b6c0f))
* feat: support diagnostic summary for ESLint & VLS ([904d49d](https://github.com/fi3ework/vite-plugin-checker/commit/904d49d))



## <small>0.4.1 (2022-02-11)</small>

* fix: runtime should not be bundled in build mode (#112) ([0330ab2](https://github.com/fi3ework/vite-plugin-checker/commit/0330ab2)), closes [#112](https://github.com/fi3ework/vite-plugin-checker/issues/112)



## 0.4.0 (2022-02-08)

## 0.4.0-beta.6 (2022-02-08)

* fix: show warning for version below vite@2.6.8 ([252b6d0](https://github.com/fi3ework/vite-plugin-checker/commit/252b6d0))
* fix: support eslint 8 ([fb2bca5](https://github.com/fi3ework/vite-plugin-checker/commit/fb2bca5))

## 0.4.0-beta.5 (2022-02-08)

* ci: fuck Windows ([1424f39](https://github.com/fi3ework/vite-plugin-checker/commit/1424f39))
* ci: update scripts ([e5eab0b](https://github.com/fi3ework/vite-plugin-checker/commit/e5eab0b))
* fix: add log level to vls test case ([70dc07a](https://github.com/fi3ework/vite-plugin-checker/commit/70dc07a))
* fix: DataCloneError at worker.postMessage ([e07269e](https://github.com/fi3ework/vite-plugin-checker/commit/e07269e))
* fix: do not crash for showing muliple checker results ([9226130](https://github.com/fi3ework/vite-plugin-checker/commit/9226130))
* fix: ESLint can report multiple errors ([e1bcfb4](https://github.com/fi3ework/vite-plugin-checker/commit/e1bcfb4))
* fix: overlay.initialIsOpen is not work ([9383440](https://github.com/fi3ework/vite-plugin-checker/commit/9383440))
* fix: resume overlay after Vite full-reload ([60aaa93](https://github.com/fi3ework/vite-plugin-checker/commit/60aaa93))
* fix: vls can report multiple errors ([db5f73c](https://github.com/fi3ework/vite-plugin-checker/commit/db5f73c))
* fix(vls): should preserve error after editing file without error ([13e97be](https://github.com/fi3ework/vite-plugin-checker/commit/13e97be))
* feat: add `maxWarnings` option to eslint (#69) ([8fc5d7f](https://github.com/fi3ework/vite-plugin-checker/commit/8fc5d7f)), closes [#69](https://github.com/fi3ework/vite-plugin-checker/issues/69)
* feat: add buildMode flag to ts checker configruration. resolve #65 (#66) ([96fc4b4](https://github.com/fi3ework/vite-plugin-checker/commit/96fc4b4)), closes [#65](https://github.com/fi3ework/vite-plugin-checker/issues/65) [#66](https://github.com/fi3ework/vite-plugin-checker/issues/66) [#65](https://github.com/fi3ework/vite-plugin-checker/issues/65)
* feat: distinguish message color for checkers ([7aa5674](https://github.com/fi3ework/vite-plugin-checker/commit/7aa5674))
* feat: new ESLint config API ([aace273](https://github.com/fi3ework/vite-plugin-checker/commit/aace273))
* feat: resume overlay when reload page ([7939381](https://github.com/fi3ework/vite-plugin-checker/commit/7939381))
* feat: rewrite overlay ([bdbe7f7](https://github.com/fi3ework/vite-plugin-checker/commit/bdbe7f7))
* feat: support log level of ESLint ([256ba5a](https://github.com/fi3ework/vite-plugin-checker/commit/256ba5a))
* feat: support overlay configuration ([eed4464](https://github.com/fi3ework/vite-plugin-checker/commit/eed4464))
* feat: support show multiple errors ([963fb65](https://github.com/fi3ework/vite-plugin-checker/commit/963fb65))
* feat: support terminal log control ([d3db2b2](https://github.com/fi3ework/vite-plugin-checker/commit/d3db2b2))
* feat: use customized overlay ([132cd4e](https://github.com/fi3ework/vite-plugin-checker/commit/132cd4e))
* feat: use Svelte to write runtime code ([6960f3d](https://github.com/fi3ework/vite-plugin-checker/commit/6960f3d))
* feat(eslint): allow specifying eslint config file (#71) ([60ab2d0](https://github.com/fi3ework/vite-plugin-checker/commit/60ab2d0)), closes [#71](https://github.com/fi3ework/vite-plugin-checker/issues/71)
* docs: update README ([d3002de](https://github.com/fi3ework/vite-plugin-checker/commit/d3002de))
* docs: update README ([8aa0dae](https://github.com/fi3ework/vite-plugin-checker/commit/8aa0dae))
* feat : support build option of tsc in watch mode ([7a0316a](https://github.com/fi3ework/vite-plugin-checker/commit/7a0316a))
* Fix #85 - add support for passing configuration to VLS. ([afd5b9b](https://github.com/fi3ework/vite-plugin-checker/commit/afd5b9b)), closes [#85](https://github.com/fi3ework/vite-plugin-checker/issues/85)
* Fix typo ([142983c](https://github.com/fi3ework/vite-plugin-checker/commit/142983c))
* Make log level filters respected in serve/watch mode with VLS. ([b1df12f](https://github.com/fi3ework/vite-plugin-checker/commit/b1df12f)), closes [#63](https://github.com/fi3ework/vite-plugin-checker/issues/63)
* Put empty check in the correct order ([c22f1d4](https://github.com/fi3ework/vite-plugin-checker/commit/c22f1d4))
* refactor ([d59030c](https://github.com/fi3ework/vite-plugin-checker/commit/d59030c))
* refactor: bump vite and plugin versoin ([63c77af](https://github.com/fi3ework/vite-plugin-checker/commit/63c77af))
* refactor: change ESLint property ([02b96cf](https://github.com/fi3ework/vite-plugin-checker/commit/02b96cf))
* refactor: format code ([3111c46](https://github.com/fi3ework/vite-plugin-checker/commit/3111c46))
* refactor: remove old runtime ([74d9be1](https://github.com/fi3ework/vite-plugin-checker/commit/74d9be1))
* refactor: simplify test process ([6542594](https://github.com/fi3ework/vite-plugin-checker/commit/6542594))
* refactor: types ([ccd1ef5](https://github.com/fi3ework/vite-plugin-checker/commit/ccd1ef5))
* build: add lint and format for Svelte ([b8951f2](https://github.com/fi3ework/vite-plugin-checker/commit/b8951f2))
* build: exclude @runtime ([9681f32](https://github.com/fi3ework/vite-plugin-checker/commit/9681f32))
* build: fix build command ([a7dc6e0](https://github.com/fi3ework/vite-plugin-checker/commit/a7dc6e0))
* test: add test for vls config ([c6501f2](https://github.com/fi3ework/vite-plugin-checker/commit/c6501f2))
* test: pass overlay test ([4285d54](https://github.com/fi3ework/vite-plugin-checker/commit/4285d54))
* test: pass test case except overlay control ([458e4cc](https://github.com/fi3ework/vite-plugin-checker/commit/458e4cc))


### BREAKING CHANGE

* eslint configs is changed. We made it full configurable of ESLint and remove all the hard coding config properties in 0.3.x. Now, you are allowed to write lint command which you're more familar with rather than JS config.


## [0.3.4](https://github.com/fi3ework/vite-plugin-checker/compare/vite-plugin-checker@0.3.3...vite-plugin-checker@0.3.4) (2021-07-31)


### Bug Fixes

* early exit when enableBuild is true ([#61](https://github.com/fi3ework/vite-plugin-checker/issues/61)) ([cc0912f](https://github.com/fi3ework/vite-plugin-checker/commit/cc0912f25bdeb53d293015ab4ca014cb5646bfc1))
* **eslint:** do not flush existing errors on changing file ([#55](https://github.com/fi3ework/vite-plugin-checker/issues/55)) ([4f7abbe](https://github.com/fi3ework/vite-plugin-checker/commit/4f7abbe1471664cd77b1c3b0d9deae241ff46ca2))
* **vls:** enable VLS check features ([#59](https://github.com/fi3ework/vite-plugin-checker/issues/59)) ([ba929c5](https://github.com/fi3ework/vite-plugin-checker/commit/ba929c57e50b8c53fee7eaf1f9b9e68d732d45e1))



## [0.3.3](https://github.com/fi3ework/vite-plugin-checker/compare/vite-plugin-checker@0.3.1...vite-plugin-checker@0.3.3) (2021-07-23)


### Bug Fixes

* eslint normalization ([#52](https://github.com/fi3ework/vite-plugin-checker/issues/52)) ([95aa772](https://github.com/fi3ework/vite-plugin-checker/commit/95aa772d934a3fe48baa6edd002aed0cd19abc8c))
* use `fs.promises` instead of `fs/promises` ([#43](https://github.com/fi3ework/vite-plugin-checker/issues/43)) ([8dd5446](https://github.com/fi3ework/vite-plugin-checker/commit/8dd54464f221f96fd2a96a30813df25aca8b77c9))
* warning level logging ([#51](https://github.com/fi3ework/vite-plugin-checker/issues/51)) ([5b0ac3a](https://github.com/fi3ework/vite-plugin-checker/commit/5b0ac3aa84a88a9e0f1067881f84c6997e346e89))


### Performance Improvements

* drop readFileSync ([#45](https://github.com/fi3ework/vite-plugin-checker/issues/45)) ([12af43d](https://github.com/fi3ework/vite-plugin-checker/commit/12af43d83b276f3c17358dd14c7273281cf6e658))



## [0.3.2](https://github.com/fi3ework/vite-plugin-checker/compare/vite-plugin-checker@0.3.1...vite-plugin-checker@0.3.2) (2021-07-19)


### Bug Fixes

* use `fs.promises` instead of `fs/promises` ([#43](https://github.com/fi3ework/vite-plugin-checker/issues/43)) ([8dd5446](https://github.com/fi3ework/vite-plugin-checker/commit/8dd54464f221f96fd2a96a30813df25aca8b77c9))


### Performance Improvements

* drop readFileSync ([107f0c8](https://github.com/fi3ework/vite-plugin-checker/commit/107f0c8f43252e38bc65bf317dd0bfdbc3e47bbf))



## [0.3.1](https://github.com/fi3ework/vite-plugin-checker/compare/vite-plugin-checker@0.3.0...vite-plugin-checker@0.3.1) (2021-07-19)


### Bug Fixes

* add chalk dependency ([#41](https://github.com/fi3ework/vite-plugin-checker/issues/41)) ([2b39c80](https://github.com/fi3ework/vite-plugin-checker/commit/2b39c80a89280004bd007a1a70b384fda579e00c))
* TS checker should respect custom tsconfig ([#39](https://github.com/fi3ework/vite-plugin-checker/issues/39)) ([948920d](https://github.com/fi3ework/vite-plugin-checker/commit/948920d5b2b8c80e960517b1a320a40e6cc087c4))
* wait for all checkers to finish during build ([#37](https://github.com/fi3ework/vite-plugin-checker/issues/37)) ([257358f](https://github.com/fi3ework/vite-plugin-checker/commit/257358fcd9b1ad28d9570c737d335225d8f60296))



# [0.3.0](https://github.com/fi3ework/vite-plugin-checker/compare/vite-plugin-checker@0.2.0...vite-plugin-checker@0.3.0) (2021-07-17)


### Bug Fixes

* add missing dependency ([66fbe8e](https://github.com/fi3ework/vite-plugin-checker/commit/66fbe8ed75185943d7020b95ac7d7bd114ad991d))
* change ESLint configuration and doc ([e825711](https://github.com/fi3ework/vite-plugin-checker/commit/e8257115bca18aa7ceb5d46a5cd4989f656579ee))
* clean code ([5b2d475](https://github.com/fi3ework/vite-plugin-checker/commit/5b2d4755cee2703937ac95c08eb0d4d32e895469))
* clean previous log ([cb17837](https://github.com/fi3ework/vite-plugin-checker/commit/cb17837e5940a221968e3dcd31588708c4881165))
* correct HMR overlay ([a386058](https://github.com/fi3ework/vite-plugin-checker/commit/a3860580144351e24de1524f61a338415e590ece))
* log line and column ([6a0d247](https://github.com/fi3ework/vite-plugin-checker/commit/6a0d2478b97b70494bddb28c49826bbea8e65e11))
* pass all test ([a30137e](https://github.com/fi3ework/vite-plugin-checker/commit/a30137e54a2ba4037cd53f40a0a71985fdddcf6c))
* set forceColor to Chalk ([c4c6887](https://github.com/fi3ework/vite-plugin-checker/commit/c4c6887dfd2849a2f878ae4db92b7d1c5f00ef91))
* set worker process to tty ([e46de1c](https://github.com/fi3ework/vite-plugin-checker/commit/e46de1c970ca520bc20c559af273480414b8cb86))
* **tsc:** show all errors in terminal ([a4bb9ce](https://github.com/fi3ework/vite-plugin-checker/commit/a4bb9ce285bcbfdece4eb619795ed90f4a7a9070))


### Features

* console.log error source ([f99588d](https://github.com/fi3ework/vite-plugin-checker/commit/f99588dbbf2cf6ca742b9ce085f56de7da9de60b))
* only import exclusive dependencies from vite-plugin-checker-vls ([8ba0641](https://github.com/fi3ework/vite-plugin-checker/commit/8ba0641969b0a67f6cab8261326dafa5a364dee9))
* support ESLint in build ([a855866](https://github.com/fi3ework/vite-plugin-checker/commit/a855866a19d682dc9b6403db46ad2015b3c9a54d))
* support ESLint on terminal log ([0819997](https://github.com/fi3ework/vite-plugin-checker/commit/081999750819e87f0e17b30c3b589de44750d21e))
* support ESLint serve ([98aca8c](https://github.com/fi3ework/vite-plugin-checker/commit/98aca8ca728c9f443436e46625b8d1cf6e2842ce))
* tsc checker extends base Checker ([8823409](https://github.com/fi3ework/vite-plugin-checker/commit/88234096d2da91846f55adf1aeea6296f61a341d))
* tsc use unified logger ([eef3d77](https://github.com/fi3ework/vite-plugin-checker/commit/eef3d771ebb0e559d4c7cc02fd04a97705f809bc))
* vls checker extends Checker ([782f0c9](https://github.com/fi3ework/vite-plugin-checker/commit/782f0c9ab306ae94a7276b49b40731217d2603d7))
* VLS use logger ([558dacb](https://github.com/fi3ework/vite-plugin-checker/commit/558dacb97d374c8286a03e572db2e672a6ef70f2))
* vue-tsc extends Checker ([95fddec](https://github.com/fi3ework/vite-plugin-checker/commit/95fddec5f959af69073f14aeb934e6e07e363dc0))



# [0.2.0](https://github.com/fi3ework/vite-plugin-checker/compare/vite-plugin-checker@0.2.0-beta.0...vite-plugin-checker@0.2.0) (2021-07-05)


### Bug Fixes

* add test for terminal log ([1f6700e](https://github.com/fi3ework/vite-plugin-checker/commit/1f6700e38fc43b38ed965312731dd99d12b33227))
* clean output by Vite hmr console clear ([b30ca51](https://github.com/fi3ework/vite-plugin-checker/commit/b30ca51a7e699f64054bfb3e95aabe7d03e55919))
* do not wrap log ([2bb6cbd](https://github.com/fi3ework/vite-plugin-checker/commit/2bb6cbdb454b4536126710373184059e47d67d59))
* **vls:** show initial error overlay ([20c95e9](https://github.com/fi3ework/vite-plugin-checker/commit/20c95e926ca7115f7ff89013af0ec6ac96c9273c))



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

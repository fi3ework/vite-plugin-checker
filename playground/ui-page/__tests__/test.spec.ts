import { describe, expect, it } from 'vitest'

import { editFile, isServe, page, viteTestUrl } from '../../testUtils'

const diagnostics = () => page.locator('.diagnostic')

async function openPage() {
  await page.goto(`${viteTestUrl}__checker/`)
  await page.locator('.groups').waitFor()
  await expect.poll(() => diagnostics().count()).toBe(2)
}

describe.runIf(isServe)('ui-page', () => {
  it('renders diagnostics from every checker under the Vite base', async () => {
    await openPage()

    await expect
      .poll(() => page.locator('.checkers').innerText())
      .toMatch(/TypeScript[\s\S]*ESLint/)
    expect(await diagnostics().allInnerTexts()).toEqual([
      expect.stringContaining('Unexpected var, use let or const instead.'),
      expect.stringContaining(
        "Type 'string' is not assignable to type 'number'.",
      ),
    ])
    expect(
      await page.locator('vite-plugin-checker-error-overlay').count(),
    ).toBe(0)
  })

  it('opens the file through `__open-in-editor` under the base', async () => {
    await openPage()
    const requested = new Promise<URL>((resolve) => {
      page.route('**/__open-in-editor*', (route) => {
        resolve(new URL(route.request().url()))
        return route.fulfill({ status: 200 })
      })
    })

    await diagnostics().first().locator('a.location').click()

    const url = await requested
    expect(url.pathname).toBe('/my-app/__open-in-editor')
    expect(url.searchParams.get('file')).toMatch(/src\/main\.ts:1:1$/)
  })

  it('filters by text', async () => {
    await openPage()
    await page.keyboard.press('/')
    await page.keyboard.type('TS2322')

    expect(await diagnostics().allInnerTexts()).toEqual([
      expect.stringContaining('TS2322'),
    ])
  })

  it('updates when a file changes', async () => {
    await openPage()

    editFile('src/main.ts', (code) => code.replace("'one'", '1'))
    await expect.poll(() => diagnostics().count(), { timeout: 15_000 }).toBe(1)
    expect(await diagnostics().innerText()).toContain('no-var')

    editFile('src/main.ts', (code) => code.replace('var ', 'const '))
    await page
      .getByText('No problems found')
      .waitFor({ timeout: 15_000 })
  })
})

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/entrar", "/registre"];

for (const path of PAGES) {
  test(`accessibilitat WCAG 2.1 AA a ${path}`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
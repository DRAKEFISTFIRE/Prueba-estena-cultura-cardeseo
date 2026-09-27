import { test, expect } from "@playwright/test";

test.describe("Navegació pública", () => {
  test("la home mostra el CTA de registre quan no hi ha sessió", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Crear compte" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ja tinc compte" })).toBeVisible();
  });

  test("entrar mostra error amb credencials buides", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Correu electrònic").fill("noexisteix@example.com");
    await page.getByLabel("Contrasenya").fill("contrasenyaqualsevol123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("status")).toBeVisible();
  });

  test("una ruta privada redirigeix a /entrar sense sessió", async ({ page }) => {
    await page.goto("/activitats");
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("registre mostra els tres passos", async ({ page }) => {
    await page.goto("/registre");
    await expect(page.getByText("Correu")).toBeVisible();
    await expect(page.getByText("Codi")).toBeVisible();
    await expect(page.getByText("Dades")).toBeVisible();
  });
});
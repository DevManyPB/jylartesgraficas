import { describe, expect, it } from "vitest";
import { CONFIGURACION_VACIA, configuracionSchema, normalizarWhatsapp } from "./esquemas";

describe("normalizarWhatsapp", () => {
  it.each([
    ["300 123 4567", "573001234567"],
    ["+57 300 123 4567", "573001234567"],
    ["(300) 123-4567", "573001234567"],
    ["573001234567", "573001234567"],
    ["", ""],
  ])("%s → %s", (entrada, esperado) => {
    expect(normalizarWhatsapp(entrada)).toBe(esperado);
  });
});

describe("configuracionSchema", () => {
  it("la configuración vacía es válida y no trae nada inventado", () => {
    expect(CONFIGURACION_VACIA.whatsapp).toBe("");
    expect(CONFIGURACION_VACIA.direccion.linea).toBe("");
    expect(CONFIGURACION_VACIA.direccion.lat).toBeNull();
    expect(CONFIGURACION_VACIA.impuestoPorcentaje).toBeNull();
    expect(CONFIGURACION_VACIA.horarios).toHaveLength(7);
  });

  it("guarda el WhatsApp normalizado", () => {
    const r = configuracionSchema.parse({ whatsapp: "+57 300 123 4567" });
    expect(r.whatsapp).toBe("573001234567");
  });

  it("rechaza un WhatsApp demasiado corto", () => {
    expect(configuracionSchema.safeParse({ whatsapp: "12345" }).success).toBe(false);
  });

  it("exige las dos coordenadas o ninguna", () => {
    expect(configuracionSchema.safeParse({ direccion: { lat: 10.4 } }).success).toBe(false);
    expect(configuracionSchema.safeParse({ direccion: { lat: 10.4, lng: -75.5 } }).success).toBe(true);
  });

  it("rechaza una latitud imposible", () => {
    expect(configuracionSchema.safeParse({ direccion: { lat: 120, lng: 0 } }).success).toBe(false);
  });

  it("acepta un día sin configurar y uno cerrado sin horas", () => {
    const horarios = configuracionSchema.parse({}).horarios;
    horarios[6] = { dia: "domingo", abre: "", cierra: "", cerrado: true };
    expect(configuracionSchema.safeParse({ horarios }).success).toBe(true);
  });

  it("rechaza un horario que cierra antes de abrir", () => {
    const horarios = configuracionSchema.parse({}).horarios;
    horarios[0] = { dia: "lunes", abre: "18:00", cierra: "08:00", cerrado: false };
    const r = configuracionSchema.safeParse({ horarios });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["horarios", 0, "cierra"]);
  });

  it("rechaza un horario con solo una de las dos horas", () => {
    const horarios = configuracionSchema.parse({}).horarios;
    horarios[0] = { dia: "lunes", abre: "08:00", cierra: "", cerrado: false };
    expect(configuracionSchema.safeParse({ horarios }).success).toBe(false);
  });

  it("exige enlaces completos en las redes", () => {
    expect(configuracionSchema.safeParse({ redes: { instagram: "instagram.com/jyl" } }).success).toBe(false);
    expect(configuracionSchema.safeParse({ redes: { instagram: "https://instagram.com/jyl" } }).success).toBe(true);
  });

  it("limita el impuesto entre 0 y 100", () => {
    expect(configuracionSchema.safeParse({ impuestoPorcentaje: 19 }).success).toBe(true);
    expect(configuracionSchema.safeParse({ impuestoPorcentaje: 150 }).success).toBe(false);
  });
});

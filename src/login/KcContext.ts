import { createGetKcContextMock } from "keycloakify/login/KcContext";

export type { KcContext } from "keycloakify/login/KcContext";

export const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension: {},
  kcContextExtensionPerPage: {},
});

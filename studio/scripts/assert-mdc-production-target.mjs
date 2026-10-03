export const MDC_PRODUCTION_TARGET = {
  dataset: "production",
  projectId: "193h5qm1",
};

export function assertMdcProductionTarget({ dataset, projectId }) {
  if (
    projectId !== MDC_PRODUCTION_TARGET.projectId ||
    dataset !== MDC_PRODUCTION_TARGET.dataset
  ) {
    throw new Error(
      `Refusing to run against ${projectId}/${dataset}; expected ${MDC_PRODUCTION_TARGET.projectId}/${MDC_PRODUCTION_TARGET.dataset}`,
    );
  }
}

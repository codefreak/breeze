import { useResizeReplMutation } from "../generated/graphql";

const useReplResize = (id: string) => {
  const [resizeShell, results] = useResizeReplMutation();
  const resize = (cols: number, rows: number) =>
    resizeShell({ variables: { id, cols, rows } });

  return [resize, results];
};

export default useReplResize;

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import React, { FC, useEffect } from "react";
import clsx from "clsx";
import { Button, CircularProgress, SxProps } from "@mui/material";
import { styled, Theme } from "@mui/material/styles";
import { trpc } from "src/lib/trpc";
import { TGridBot } from "src/sections/grid-bot/common/trpc-types";

const componentName = "ManualProcessButton";
const classes = {
  root: `${componentName}-root`,
};
const StyledButton = styled(Button)(({ theme }) => ({
  /* Styles applied to the root element. */
  [`&.${classes.root}`]: {},
}));

type ManualProcessButtonProps = {
  className?: string;
  bot: TGridBot;
  sx?: SxProps<Theme>;
};

export const ManualProcessButton: FC<ManualProcessButtonProps> = (props) => {
  const { className, bot, sx } = props;
  const { enqueueSnackbar } = useSnackbar();

  const queryClient = useQueryClient();
  const { isLoading, error, mutate, status } = useMutation(
    ["manualProcess", bot.id],
    async () =>
      trpc.gridBot.manualProcess.mutate({
        botId: bot.id,
      }),
    {
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: ["gridBot", bot.id],
        });
      },
    },
  );

  useEffect(() => {
    if (status === "success") {
      enqueueSnackbar("Bot has been enabled", {
        variant: "success",
      });
    } else if (status === "error") {
      enqueueSnackbar(JSON.stringify(error), {
        variant: "error",
      });
      console.log(error);
    }
  }, [status]);

  return (
    <Button
      onClick={() => mutate()}
      className={clsx(classes.root, className)}
      variant="contained"
      color="primary"
      type="submit"
      disabled={isLoading}
      startIcon={
        isLoading ? (
          <CircularProgress variant="indeterminate" size={18} />
        ) : null
      }
    >
      Manual Process
    </Button>
  );
};

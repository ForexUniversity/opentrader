import Link from "@mui/joy/Link";
import { SvgIconProps } from "@mui/joy/SvgIcon";
import { FC } from "react";
import { GITHUB_REPOSITORY_URL } from "src/components/joy/ui/constants";
import { GithubIcon } from "./icons/Github";

type GithubLinkProps = {
  iconSize?: SvgIconProps["size"];
};

export const GithubLink: FC<GithubLinkProps> = ({ iconSize }) => {
  return (
    <Link href={GITHUB_REPOSITORY_URL} target="_blank">
      <GithubIcon size={iconSize} />
    </Link>
  );
};

"use client";
import { Fragment, useMemo } from "react";

import TopBar from "../toolbar";
import { ColumnsMenu } from "./columns/columns-menu";
import CustomBubbleMenu from "./formatting/custom-bubble-menu";

type VisiblilityOptions = {
  columnsMenu: boolean;
  customBubbleMenu: boolean;
  topBar: Partial<{
    enabled: boolean;
  }>;
};

const defaultVisibilityOptions: VisiblilityOptions = {
  topBar: {
    enabled: true,
  },
  customBubbleMenu: true,
  columnsMenu: true,
};

export type MenuRendererProps = {
  visibilityOptions?: Partial<VisiblilityOptions>;
};

export const MenuRenderer = ({ visibilityOptions }: MenuRendererProps) => {
  const constructedVisibilityOptions = useMemo(() => {
    return {
      ...defaultVisibilityOptions,
      ...visibilityOptions,
      topBar: {
        enabled:
          visibilityOptions?.topBar?.enabled ??
          defaultVisibilityOptions.topBar.enabled,
      },
    };
  }, [visibilityOptions]);

  const OptionalComponents = useMemo(() => {
    let components: React.ReactNode[] = [];

    if (constructedVisibilityOptions.topBar.enabled) {
      components.push(<TopBar />);
    }
    if (constructedVisibilityOptions.customBubbleMenu) {
      components.push(<CustomBubbleMenu />);
    }
    if (constructedVisibilityOptions.columnsMenu) {
      components.push(<ColumnsMenu />);
    }

    return components;
  }, [
    constructedVisibilityOptions.topBar.enabled,
    constructedVisibilityOptions.customBubbleMenu,
    constructedVisibilityOptions.columnsMenu,
  ]);

  return (
    <>
      {OptionalComponents.map((component, index) => (
        <Fragment key={index}>{component}</Fragment>
      ))}
    </>
  );
};

MenuRenderer.displayName = "MenuRenderer";
export default MenuRenderer;

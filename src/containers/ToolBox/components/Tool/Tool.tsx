import React from 'react';
import { Root } from './style';
import { useFocusEffect, useRovingTabIndex } from 'react-roving-tabindex';

interface Props {
  isSelected?: boolean;
  onSelect: () => void;
  title: string;
  img: string;
}

function Tool({ img, title, onSelect, isSelected }: Props) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [tabIndex, focused, handleKeyDown, handleClick] = useRovingTabIndex(
    ref,
    false,
  );

  useFocusEffect(focused, ref);

  return (
    <Root
      className={`tooltip ${isSelected ? 'active' : ''}`}
      onClick={() => {
        handleClick();
        onSelect();
      }}
      ref={ref}
      tabIndex={tabIndex}
      aria-current={isSelected}
      onKeyDown={handleKeyDown}
    >
      <span className="tooltiptext">{title}</span>
      <img src={img} alt="" />
    </Root>
  );
}

export default Tool;

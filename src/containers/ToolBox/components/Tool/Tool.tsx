import React, { useRef } from 'react';
import { Root } from './style';
import { useRovingTabIndex, useFocusEffect } from 'react-roving-tabindex';

interface Props {
  isSelected?: boolean;
  onSelect: () => void;
  title: string;
  img: string;
}

function Tool({ img, title, onSelect, isSelected }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  // handleKeyDown and handleClick are stable for the lifetime of the component:
  const [tabIndex, focused, handleKeyDown, handleClick] = useRovingTabIndex(
    ref, // Don't change the value of this ref.
    false,
  );

  // Use some mechanism to set focus on the button if it gets focus.
  // In this case I use the included useFocusEffect hook:
  useFocusEffect(focused, ref);

  return (
    <Root
      className={`tooltip ${isSelected ? 'active' : ''}`}
      onClick={(e) => {
        onSelect();
        handleClick();
      }}
      ref={ref}
      tabIndex={tabIndex} // tabIndex must be applied here
      onKeyDown={handleKeyDown} // handler applied here
      aria-current={isSelected}
    >
      <span className="tooltiptext">{title}</span>
      <img src={img} alt="" />
    </Root>
  );
}

export default Tool;

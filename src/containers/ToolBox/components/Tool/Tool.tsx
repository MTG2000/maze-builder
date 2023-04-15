import React from 'react';
import { Root } from './style';

interface Props {
  isSelected?: boolean;
  onSelect: () => void;
  title: string;
  img: string;
}

function Tool({ img, title, onSelect, isSelected }: Props) {
  return (
    <Root
      className={`tooltip ${isSelected ? 'active' : ''}`}
      onClick={() => {
        onSelect();
      }}
    >
      <span className="tooltiptext">{title}</span>
      <img src={img} alt={title} />
    </Root>
  );
}

export default Tool;

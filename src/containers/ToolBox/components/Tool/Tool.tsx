import React from 'react';
import styled from 'styled-components';

interface Props {
  isSelected?: boolean;
  onSelect: () => void;
  title: string;
  img: string;
}

const Root = styled.div`
  width: 55px;
  height: 55px;
  transform: scale(1.2);
  transition: transform 0.3s ease-in-out;
  :hover {
    transform: scale(1.5);
  }

  @media screen and (max-width: 668px) {
    width: 35px;
    height: 35px;
    &.tooltip .tooltiptext {
      display: none;
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &.active {
    transform: scale(1.8);
    img {
      -webkit-filter: drop-shadow(0 0 5px #fff);
      filter: drop-shadow(0 0 5px #fff);
    }
  }

  /* Tooltip container */
  &.tooltip {
    position: relative;
    display: inline-block;
  }

  /* Tooltip text */
  &.tooltip .tooltiptext {
    visibility: hidden;
    width: 120px;
    background-color: #333;
    color: #fff;
    text-align: center;
    padding: 5px 0;
    border-radius: 6px;

    /* Position the tooltip text - see examples below! */
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 105%;
    z-index: 1;
  }

  /* Show the tooltip text when you mouse over the tooltip container */
  &.tooltip:hover .tooltiptext {
    visibility: visible;
  }
`;

function Tool({ img, title, onSelect, isSelected }: Props) {
  return (
    <Root
      className={`tooltip ${isSelected ? 'active' : ''}`}
      onClick={onSelect}
    >
      <span className="tooltiptext">{title}</span>
      <img src={img} alt={title} />
    </Root>
  );
}

export default Tool;

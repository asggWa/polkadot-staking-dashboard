// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import styled from 'styled-components';

interface WrapperProps {
  paddingLeft: boolean;
  paddingRight: string | null;
}

export const Wrapper = styled.div<WrapperProps>`
  display: flex;
  flex-flow: row wrap;

  > .hide-with-padding {
    padding-left: ${(props) => (props.paddingLeft ? '3rem' : '0')};
    padding-right: ${(props) =>
      props.paddingRight ? props.paddingRight : '0'};
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
    flex-shrink: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    position: relative;
    margin-bottom: 0;

    .icon {
      position: absolute;
      left: 0;
      top: 0;
      display: flex;
      flex-flow: row wrap;
      align-items: center;
    }

    .btn {
      position: absolute;
      right: 0;
      top: 0;
      padding: 0.1rem;
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      width: ${(props) => props.paddingRight};
      > div {
        margin-left: 0.75rem;
      }

      > span {
        padding-left: 0.8rem;
      }
    }
  }
`;

// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigNumber from 'bignumber.js';
import { useApi } from 'contexts/Api';
import { useBalances } from 'contexts/Balances';
import { useConnect } from 'contexts/Connect';
import { useActivePools } from 'contexts/Pools/ActivePools';
import { usePoolsConfig } from 'contexts/Pools/PoolsConfig';
import { useStaking } from 'contexts/Staking';
import { useTransferOptions } from 'contexts/TransferOptions';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { planckToUnit, unitToPlanck } from 'Utils';
import { UnbondFeedbackProps } from '../types';
import { Warning } from '../Warning';
import { Spacer } from '../Wrappers';
import { UnbondInput } from './UnbondInput';

export const UnbondFeedback = ({
  bondFor,
  inSetup = false,
  warnings = [],
  setters = [],
  listenIsValid = () => {},
  defaultBond,
  setLocalResize,
  txFees,
}: UnbondFeedbackProps) => {
  const defaultValue = defaultBond ? String(defaultBond) : '';

  const { network } = useApi();
  const { activeAccount } = useConnect();
  const { staking, getControllerNotImported } = useStaking();
  const { getBondedAccount } = useBalances();
  const { getTransferOptions } = useTransferOptions();
  const { isDepositor } = useActivePools();
  const { stats } = usePoolsConfig();
  const { minJoinBond, minCreateBond } = stats;
  const { units, unit } = network;
  const controller = getBondedAccount(activeAccount);
  const { minNominatorBond } = staking;
  const allTransferOptions = getTransferOptions(activeAccount);
  const { t } = useTranslation('library');

  // get bond options for either nominating or pooling.
  const transferOptions =
    bondFor === 'pool' ? allTransferOptions.pool : allTransferOptions.nominate;
  const { active } = transferOptions;

  // store errors
  const [errors, setErrors] = useState<Array<string>>([]);

  // local bond state
  const [bond, setBond] = useState<{ bond: string }>({
    bond: defaultValue,
  });

  // current bond value BigNumber
  const bondBn = unitToPlanck(String(bond.bond), units);

  // update bond on account change
  useEffect(() => {
    setBond({
      bond: defaultValue,
    });
  }, [activeAccount]);

  // handle errors on input change
  useEffect(() => {
    handleErrors();
  }, [bond, txFees]);

  // if resize is present, handle on error change
  useEffect(() => {
    if (setLocalResize) setLocalResize();
  }, [errors]);

  // add this component's setBond to setters
  setters.push({
    set: setBond,
    current: bond,
  });

  // bond amount to minimum threshold
  const minBondBn =
    bondFor === 'pool'
      ? inSetup || isDepositor()
        ? minCreateBond
        : minJoinBond
      : minNominatorBond;
  const minBondUnit = planckToUnit(minBondBn, units);

  // unbond amount to minimum threshold
  const unbondToMin =
    bondFor === 'pool'
      ? inSetup || isDepositor()
        ? BigNumber.max(active.minus(minCreateBond), new BigNumber(0))
        : BigNumber.max(active.minus(minJoinBond), new BigNumber(0))
      : BigNumber.max(active.minus(minNominatorBond), new BigNumber(0));

  // check if bonded is below the minimum required
  const nominatorActiveBelowMin =
    bondFor === 'nominator' &&
    !active.isZero() &&
    active.isLessThan(minNominatorBond);
  const poolToMinBn = isDepositor() ? minCreateBond : minJoinBond;
  const poolActiveBelowMin =
    bondFor === 'pool' && active.isLessThan(poolToMinBn);

  // handle error updates
  const handleErrors = () => {
    const _errors = [...warnings];
    const _bond = bond.bond;
    const _decimals = bond.bond.toString().split('.')[1]?.length ?? 0;

    // unbond errors
    if (bondBn.isGreaterThan(active)) {
      _errors.push(t('unbondAmount'));
    }

    // unbond errors for staking only
    if (bondFor === 'nominator')
      if (getControllerNotImported(controller))
        _errors.push(t('importedToUnbond'));

    if (bond.bond !== '' && bondBn.isLessThan(new BigNumber(1))) {
      _errors.push(t('valueTooSmall'));
    }

    if (_decimals > units) {
      _errors.push(`Bond amount can only have at most ${units} decimals.`);
    }

    if (bondBn.isGreaterThan(unbondToMin)) {
      // start the error message stating a min bond is required.
      let err = `${t('minimumBond', { minBondUnit, unit })} `;
      // append the subject to the error message.
      if (bondFor === 'nominator') {
        err += t('whenActivelyNominating');
      } else if (isDepositor()) {
        err += t('asThePoolDepositor');
      } else {
        err += t('asAPoolMember');
      }
      _errors.push(err);
    }
    listenIsValid(!_errors.length && _bond !== '');
    setErrors(_errors);
  };

  return (
    <>
      {errors.map((err: string, i: number) => (
        <Warning key={`unbond_error_${i}`} text={err} />
      ))}
      <Spacer />
      <UnbondInput
        active={active}
        defaultValue={defaultValue}
        disabled={
          active.isZero() || nominatorActiveBelowMin || poolActiveBelowMin
        }
        unbondToMin={unbondToMin}
        setters={setters}
        value={bond.bond}
      />
    </>
  );
};

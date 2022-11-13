import classNames from 'classnames';
import {
  ReactChild,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BodyPart } from 'solarxr-protocol';
import { PersonFrontIcon } from './PersonFrontIcon';

export function BodyInteractions({
  leftControls,
  rightControls,
  assignedRoles,
  width = 228,
  dotsSize = 20,
  variant = 'tracker-select',
}: {
  leftControls?: ReactChild;
  rightControls?: ReactChild;
  width?: number;
  dotsSize?: number;
  variant?: 'dots' | 'tracker-select';
  assignedRoles: BodyPart[];
}) {
  const personRef = useRef<HTMLDivElement | null>(null);
  const leftContainerRef = useRef<HTMLDivElement | null>(null);
  const rightContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefRef = useRef<HTMLCanvasElement | null>(null);
  const [slotsButtonsPos, setSlotsButtonPos] = useState<
    {
      id: string;
      left: number;
      top: number;
      height: number;
      width: number;
      hidden: boolean;
      buttonOffset: {
        left: number;
        top: number;
      };
    }[]
  >([]);

  const getSlotsPos = () => {
    return (
      (personRef.current && [
        ...(personRef.current.querySelectorAll('.body-part-circle') as any),
      ]) ||
      []
    );
  };

  const getControlsPos = () => {
    const pos = (container: HTMLDivElement) =>
      [...(container.querySelectorAll('.control') as any)].filter(
        ({ id }) => !!id
      );

    const left =
      (leftContainerRef.current && pos(leftContainerRef.current)) || [];
    const right =
      (rightContainerRef.current && pos(rightContainerRef.current)) || [];
    return [...left, ...right];
  };

  const getOffset = (el: HTMLDivElement, offset = { left: 0, top: 0 }) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left - (offset.left || 0),
      top: rect.top - (offset.top || 0),
      width: rect.width || el.offsetWidth,
      height: rect.height || el.offsetHeight,
    };
  };

  useLayoutEffect(() => {
    if (
      !(
        personRef.current &&
        canvasRefRef.current &&
        rightContainerRef.current &&
        leftContainerRef.current
      )
    )
      return;

    const ctx = canvasRefRef.current.getContext('2d');
    if (!ctx) return;
    const slotsPos = getSlotsPos();
    const controlsPos = getControlsPos();

    canvasRefRef.current.width = canvasRefRef.current.offsetWidth;
    canvasRefRef.current.height = canvasRefRef.current.offsetHeight;

    ctx.strokeStyle = '#608AAB';
    ctx.lineWidth = 1;

    const canvasBox = canvasRefRef.current.getBoundingClientRect();
    const personBox = personRef.current.getBoundingClientRect();

    const controlsPosIds = controlsPos.map(({ id: cid }) => cid);
    const slots = slotsPos.map((slot: HTMLDivElement) => {
      const slotPosition = getOffset(slot, canvasBox);
      return {
        ...slotPosition,
        id: slot.id,
        hidden:
          variant === 'tracker-select' && !controlsPosIds.includes(slot.id),
        buttonOffset: {
          left: canvasBox.left - personBox.left,
          top: canvasBox.top - personBox.top,
        },
      };
    });

    if (variant === 'tracker-select') {
      slots.forEach((slot) => {
        const controls = controlsPos.filter(({ id }) => id === slot.id);
        controls.forEach((control) => {
          const controlPosition = getOffset(control, canvasBox);

          const offsetX =
            controlPosition.left < slot.left ? controlPosition.width : 0;

          const constolLeft = controlPosition.left + offsetX;
          const LINE_BREAK_WIDTH = 40;
          const leftOffsetX =
            LINE_BREAK_WIDTH * (controlPosition.left < slot.left ? -1 : 1);

          ctx.beginPath();
          ctx.moveTo(
            constolLeft,
            controlPosition.top + controlPosition.height / 2
          );
          ctx.lineTo(
            constolLeft - leftOffsetX,
            controlPosition.top + controlPosition.height / 2
          );
          ctx.lineTo(slot.left + slot.width / 2, slot.top + slot.height / 2);
          ctx.stroke();
        });
      });
    }
    setSlotsButtonPos(slots);
  }, [leftControls, rightControls, variant]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRefRef}
        className="absolute w-full h-full top-0 z-10"
        width="100%"
        height="100%"
      ></canvas>
      <div className="flex">
        <div ref={leftContainerRef} className="z-10">
          {leftControls}
        </div>
        <div
          ref={personRef}
          className={classNames(
            'relative w-full flex justify-center',
            variant === 'tracker-select' && 'mx-10'
          )}
        >
          <PersonFrontIcon width={width}></PersonFrontIcon>
          {slotsButtonsPos.map(
            ({ top, left, height, width, id, hidden, buttonOffset }) => (
              <div
                key={id}
                className="absolute z-10"
                style={{
                  top: top + height / 2 - dotsSize / 2 + buttonOffset.top,
                  left: left + width / 2 - dotsSize / 2 + buttonOffset.left,
                }}
              >
                <div
                  className={classNames(
                    'rounded-full outline outline-2 outline-background-20 transition-opacity',
                    (assignedRoles.includes((BodyPart as any)[id]) &&
                      'bg-background-70') ||
                      'bg-background-10',
                    (hidden && 'opacity-0') || 'opacity-100'
                  )}
                  style={{ width: dotsSize, height: dotsSize }}
                ></div>
              </div>
            )
          )}
        </div>
        <div ref={rightContainerRef} className="z-10">
          {rightControls}
        </div>
      </div>
    </div>
  );
}

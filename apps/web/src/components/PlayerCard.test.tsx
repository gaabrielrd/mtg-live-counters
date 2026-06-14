import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlayerCard } from "./PlayerCard";

test("PlayerCard renders the player name, life total, and metadata", () => {
  const markup = renderToStaticMarkup(
    <PlayerCard
      displayName="Serra Angel"
      currentLifeTotal={37}
      connectionState="connected"
      isOwner
      seat={1}
      onLifeChange={() => {}}
    />
  );

  assert.match(markup, /Serra Angel/);
  assert.match(markup, />37</);
  assert.match(markup, /Owner/);
  assert.match(markup, /Seat 1/);
  assert.match(markup, /connected/);
});

test("PlayerCard shows the viewer marker when isViewer is true", () => {
  const markup = renderToStaticMarkup(
    <PlayerCard
      displayName="Jace"
      currentLifeTotal={40}
      connectionState="connected"
      isViewer
      onLifeChange={() => {}}
    />
  );

  assert.match(markup, /You/);
});

test("PlayerCard keeps long names renderable", () => {
  const markup = renderToStaticMarkup(
    <PlayerCard
      displayName="Atraxa Praetors Voice And Another Very Long Table Name"
      currentLifeTotal={18}
      connectionState="disconnected"
      onLifeChange={() => {}}
    />
  );

  assert.match(markup, /Atraxa Praetors Voice And Another Very Long Table Name/);
});

test("PlayerCard disables both action buttons when disabled", () => {
  const markup = renderToStaticMarkup(
    <PlayerCard
      displayName="Liliana"
      currentLifeTotal={22}
      connectionState="connected"
      disabled
      onLifeChange={() => {}}
    />
  );

  const disabledCount = (markup.match(/disabled=""/g) ?? []).length;
  assert.equal(disabledCount, 2);
});

test("PlayerCard wires decrement and increment callbacks with delta values", () => {
  const recordedDeltas: number[] = [];

  const card = PlayerCard({
    displayName: "Chandra",
    currentLifeTotal: 25,
    connectionState: "connected",
    onLifeChange: (delta) => {
      recordedDeltas.push(delta);
    }
  });

  assert.ok(React.isValidElement(card));

  const rootElement = card as React.ReactElement<{ children: React.ReactNode }>;
  const outerChildren = React.Children.toArray(rootElement.props.children);
  const lifeRow = outerChildren[1];

  assert.ok(React.isValidElement(lifeRow));

  const lifeRowElement = lifeRow as React.ReactElement<{ children: React.ReactNode }>;
  const rowChildren = React.Children.toArray(lifeRowElement.props.children);
  const decrementButton = rowChildren[0];
  const incrementButton = rowChildren[2];

  assert.ok(React.isValidElement(decrementButton));
  assert.ok(React.isValidElement(incrementButton));

  const decrementButtonElement = decrementButton as React.ReactElement<{
    onClick: () => void;
  }>;
  const incrementButtonElement = incrementButton as React.ReactElement<{
    onClick: () => void;
  }>;

  decrementButtonElement.props.onClick();
  incrementButtonElement.props.onClick();

  assert.deepEqual(recordedDeltas, [-1, 1]);
});

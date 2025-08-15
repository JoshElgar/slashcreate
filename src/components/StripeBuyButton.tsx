"use client";

export function StripeBuyButton() {
  return (
    <div className="w-full flex justify-center py-4">
      <stripe-buy-button
        buy-button-id="buy_btn_1RwJFGJ0vM7Am4Y4dU1D07ss"
        publishable-key="pk_live_51P8bcuJ0vM7Am4Y4xsMipLV7pBhNMuJhgX8A7e7551irWyn70NjRPvj1JcMakZa3odgtfowyGrzLnteA7DQnILxt00VQBUkMI5"
      ></stripe-buy-button>
    </div>
  );
}

import React from "react";
import { useState } from "react";

const TypingEffect = ({
  formValue,
  handleInputSubmit,
  typedText,
  setTypedText,
  aiResponse,
  setAiResponse,
  isLoading,
  weeks,
  handleChangeSlider,
}) => {
  return (
    <div>
      {formValue.radio === "Ask" && (
        <div>
          <p>Ask your assistant about your calendar</p>
          <form
            onSubmit={handleInputSubmit}
            style={{ textAlign: "center", marginTop: 10, marginBottom: 20 }}
          >
            <textarea
              placeholder="Ask your calendar..."
              className="input"
              name="text"
              type="text"
              id="prompt"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
            />
            <br />
            <div>
              <p>Number of weeks ahead assistant should consider: {weeks}</p>
              <input
                type="range"
                min="1"
                max="52"
                value={weeks}
                onChange={handleChangeSlider}
                step="1"
              />
            </div>
            <button className="shadow__btn" type="submit">
              Ask
            </button>
          </form>
          <div style={{ textAlign: "center", top: 10 }}>
            <h2>AI Response:</h2>
            <div
              style={{ paddingBottom: 20, position: "relative", marginTop: 10 }}
            >
              <textarea
                className="textFeildResponse"
                name="text"
                type="text"
                value={aiResponse}
                disabled
              />
              {isLoading && (
                <div
                  className="loader"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingEffect;

import { Headphones, Speaker, Check, RotateCcw } from "lucide-react";
import player from "../store/usePlayerStore";
export default function SoundControls({ compact = false }) {
  const {
    soundMode,
    spatialWidth,
    roomAmount,
    setSoundMode,
    setSpatialWidth,
    setRoomAmount,
    isPlaying,
    resetSpatial,
  } = player();
  const spatial = soundMode === "spatial";
  return (
    <div
      className={"listening-controls " + (compact ? "compact" : "immersive")}
    >
      {!compact && (
        <div
          className={
            "sound-space " +
            (spatial ? "spatial" : "") +
            " " +
            (isPlaying ? "playing" : "")
          }
          style={{ "--spread": `${21 + spatialWidth * 19}%` }}
          aria-hidden="true"
        >
          <i className="sound-orbit one" />
          <i className="sound-orbit two" />
          <span className="sound-source left">L</span>
          <span className="sound-source right">R</span>
          <div className="sound-listener">
            <Headphones size={38} />
          </div>
          {spatial && (
            <>
              <i className="rear-dot left" />
              <i className="rear-dot right" />
            </>
          )}
          <span className="sound-space-label">
            {spatial ? "A LITTLE MORE SPACE" : "LEFT. RIGHT. JUST RIGHT."}
          </span>
        </div>
      )}
      <div className="listening-modes" role="group" aria-label="Listening mode">
        {[
          ["stereo", "Stereo", "The original left & right mix", Speaker],
          [
            "spatial",
            "Spatial stereo",
            "Surround feel for headphones",
            Headphones,
          ],
        ].map(([id, label, description, Icon]) => (
          <button
            key={id}
            type="button"
            aria-pressed={soundMode === id}
            className={soundMode === id ? "selected" : ""}
            onClick={() => setSoundMode(id)}
          >
            <Icon size={21} />
            <span>
              <b>{label}</b>
              <small>{description}</small>
            </span>
            {soundMode === id && <Check size={15} />}
          </button>
        ))}
      </div>
      {spatial && (
        <div className="spatial-adjustments">
          <div className="sound-adjustment-heading">
            <span>Make room for the music</span>
            <button
              type="button"
              aria-label="Reset spatial settings"
              onClick={resetSpatial}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
          <label>
            <span>
              Soundstage<output>{Math.round(spatialWidth * 100)}%</output>
            </span>
            <input
              type="range"
              aria-label="Spatial soundstage"
              min="0"
              max="1"
              step=".01"
              value={spatialWidth}
              onChange={(e) => setSpatialWidth(e.target.value)}
            />
            <small>
              Intimate<span>Expansive</span>
            </small>
          </label>
          <label>
            <span>
              Room<output>{Math.round(roomAmount * 100)}%</output>
            </span>
            <input
              type="range"
              aria-label="Spatial room"
              min="0"
              max="1"
              step=".01"
              value={roomAmount}
              onChange={(e) => setRoomAmount(e.target.value)}
            />
            <small>
              Dry<span>Airy</span>
            </small>
          </label>
          <p className="spatial-note">
            Use stereo headphones. Fixed binaural processing adds space to your
            stereo mix. No head tracking or Dolby Atmos decoding.
          </p>
        </div>
      )}
    </div>
  );
}

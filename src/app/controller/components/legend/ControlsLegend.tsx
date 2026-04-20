import {ControlMode} from "@/app/store";
import {gamepadLegend, keyboardLegend} from "@/app/controller/constants/control-legends";

type ControlsLegendProps = {
  controlMode: ControlMode;
};

function ControlsLegend({controlMode}: ControlsLegendProps) {
  const legendItems = controlMode === 'gamepad' ? gamepadLegend : keyboardLegend;

  return (
    <div className="controller-legend">
      <h2>Controls Legend</h2>
      <p>{controlMode === 'gamepad' ? 'Gamepad mapping' : 'Keyboard mapping'}</p>
      <div className="controller-legend-scroll">
        {legendItems.map((item) => (
          <article key={item.control} className="legend-item">
            <h3>{item.control}</h3>
            <p>{item.action}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ControlsLegend;

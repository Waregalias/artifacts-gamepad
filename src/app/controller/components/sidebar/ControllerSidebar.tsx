import {ControlMode} from "@/app/store";
import SettingsForm from "@/app/components/SettingsForm";
import ControlsLegend from "@/app/controller/components/legend/ControlsLegend";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

type ControllerSidebarProps = {
  leftMenuOpen: boolean;
  controlMode: ControlMode;
  onControlModeChange: (mode: ControlMode) => void;
};

function ControllerSidebar({leftMenuOpen, controlMode, onControlModeChange}: ControllerSidebarProps) {
  return (
    <aside className={`controller-float-panel ${leftMenuOpen ? 'is-open' : 'is-closed'}`}>
      <header className="controller-header">
        <p className="controller-subtitle">Artifacts MMO</p>
        <h1>Gamepad Hub</h1>
      </header>

      <div className="controller-input-mode">
        <h2>Input Mode</h2>
        <Select value={controlMode} onValueChange={(value) => onControlModeChange(value as ControlMode)}>
          <SelectTrigger className="controller-mode-select">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gamepad">Gamepad</SelectItem>
            <SelectItem value="keyboard">Keyboard / Mouse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ControlsLegend controlMode={controlMode}/>

      <SettingsForm/>
    </aside>
  );
}

export default ControllerSidebar;

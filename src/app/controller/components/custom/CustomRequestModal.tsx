import {Button} from "@/components/ui/button";
import {Spinner} from "@/components/ui/kibo-ui/spinner";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {availableCustomRoutes, HttpMethod} from "@/app/controller/constants/custom-routes";

type CustomRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName?: string;
  customRoutePreset: string;
  onRoutePresetChange: (presetKey: string) => void;
  customMethod: HttpMethod;
  onMethodChange: (method: HttpMethod) => void;
  customRoute: string;
  onRouteChange: (route: string) => void;
  customPayload: string;
  onPayloadChange: (payload: string) => void;
  customResponse: string;
  customSending: boolean;
  customLoopRunning: boolean;
  onSend: () => void;
  onLoop: () => void;
};

function CustomRequestModal({
  open,
  onOpenChange,
  characterName,
  customRoutePreset,
  onRoutePresetChange,
  customMethod,
  onMethodChange,
  customRoute,
  onRouteChange,
  customPayload,
  onPayloadChange,
  customResponse,
  customSending,
  customLoopRunning,
  onSend,
  onLoop,
}: CustomRequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="controller-custom-modal">
        <DialogHeader>
          <DialogTitle>Custom API Request</DialogTitle>
          <DialogDescription>
            Character base: `https://api.artifactsmmo.com/my/{characterName || 'CHARACTER_NAME'}` (you can also use full `/my/...` routes).
          </DialogDescription>
        </DialogHeader>

        <div className="controller-custom-grid">
          <div>
            <label className="controller-custom-label">Route Presets</label>
            <Select value={customRoutePreset} onValueChange={onRoutePresetChange}>
              <SelectTrigger>
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                {availableCustomRoutes.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="controller-custom-label">Method</label>
            <Select value={customMethod} onValueChange={(value) => onMethodChange(value as HttpMethod)}>
              <SelectTrigger>
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="controller-custom-label">Route</label>
            <Input
              value={customRoute}
              onChange={(event) => onRouteChange(event.target.value)}
              placeholder="/action/unequip or /my/bank/items?page=1&size=20"
            />
          </div>

          <div>
            <label className="controller-custom-label">{customMethod === 'GET' || customMethod === 'DELETE' ? 'Params (JSON)' : 'Body (JSON)'}</label>
            <Textarea
              value={customPayload}
              onChange={(event) => onPayloadChange(event.target.value)}
              placeholder='{"slot":"weapon_slot"}'
              className="controller-custom-textarea"
            />
          </div>

          <div>
            <label className="controller-custom-label">Response</label>
            <Textarea
              value={customResponse}
              readOnly
              className="controller-custom-textarea controller-custom-response"
              placeholder="Response will appear here"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onSend} disabled={customSending || customLoopRunning}>
            {!customSending && 'Send'}
            {customSending && <Spinner/>}
          </Button>
          <Button type="button" onClick={onLoop} disabled={customSending || customLoopRunning}>
            {!customLoopRunning && 'Loop'}
            {customLoopRunning && <Spinner/>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomRequestModal;

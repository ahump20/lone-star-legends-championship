/**
 * Attach basic keyboard listeners to the window to control gameplay. This input
 * model favors simplicity: one key for swing, arrows for pitching and baserunning.
 *
 * @param state The shared game state to modify in response to player inputs.
 */
export function attachInput(state) {
    window.addEventListener("keydown", (e) => {
        switch (e.key) {
            case " ": // spacebar triggers a swing
                state.swingBat?.();
                break;
            case "ArrowUp":
                state.pitch?.("up");
                break;
            case "ArrowDown":
                state.pitch?.("down");
                break;
            case "ArrowLeft":
                state.advanceRunner?.(-1);
                break;
            case "ArrowRight":
                state.advanceRunner?.(1);
                break;
            default:
                break;
        }
    });
}

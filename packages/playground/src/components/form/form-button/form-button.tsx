import { Component, Element, Event, EventEmitter, Prop } from "@stencil/core";

@Component({
  tag: "form-button",
  styleUrl: "form-button.scss",
  shadow: true
})
export class FormButton {
  @Element() el: HTMLStencilElement = {} as HTMLStencilElement;
  @Event() buttonPressed: EventEmitter = {} as EventEmitter;
  @Prop() disabled: boolean = false;
  @Prop() spinner: boolean = false;

  handleClick(e) {
    e.preventDefault();

    this.buttonPressed.emit(e);
  }

  render() {
    return (
      <button
        disabled={this.disabled}
        onClick={this.handleClick.bind(this)}
        class={this.el.className || "button"}
      >
        {this.spinner ? (
          <widget-spinner visible={true} type="circle" color="white" />
        ) : (
          {}
        )}
        <slot />
      </button>
    );
  }
}

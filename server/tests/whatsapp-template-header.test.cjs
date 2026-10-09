const { sendInvitationTemplate } = require("../utils/whatsappCloud");

describe("approved invitation template image header", () => {
  const environment = {
    WHATSAPP_PHONE_NUMBER_ID: "synthetic-phone-id",
    WHATSAPP_BUSINESS_ACCOUNT_ID: "synthetic-business-id",
    WHATSAPP_ACCESS_TOKEN: "synthetic-test-only-token",
    WHATSAPP_INVITE_TEMPLATE_NAME: "vowlink_invitation",
    WHATSAPP_TEMPLATE_LANGUAGE: "en",
    WHATSAPP_GUEST_NAME_PARAMETER: "guest_name",
    WHATSAPP_INVITE_MESSAGE_PARAMETER: "invite_message",
    WHATSAPP_URL_BUTTON_INDEX: "0",
    WHATSAPP_URL_BUTTON_VALUE_MODE: "slug",
  };
  let previous;
  beforeEach(() => {
    previous = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
    Object.assign(process.env, environment);
    global.fetch.mockReset().mockResolvedValue({
      ok: true, json: async () => ({ messages: [{ id: "synthetic-message" }] }),
    });
  });
  afterEach(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });

  const send = async (inviteLink = "https://vowlink.co/invite/synthetic-slug", couplePhotoUrl) => {
    await sendInvitationTemplate({
      to: "2348000000001", guestName: "Synthetic Guest",
      coupleNames: "Synthetic Couple", inviteLink, couplePhotoUrl,
    });
    expect(jest.isMockFunction(global.fetch)).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    return JSON.parse(global.fetch.mock.calls[0][1].body).template;
  };

  test("includes exactly one header with exactly one image from the public JPEG asset", async () => {
    const template = await send();
    expect(template.components.filter((component) => component.type === "header")).toEqual([{
      type: "header", parameters: [{ type: "image", image: { link: "https://vowlink.co/vowlink-logo.jpg" } }],
    }]);
  });

  test("uses the existing uploaded couple photo as a bounded JPEG image header", async () => {
    const template = await send(undefined, "https://res.cloudinary.com/synthetic/image/upload/v123/couple.png");
    expect(template.components.filter((component) => component.type === "header")).toEqual([{
      type: "header", parameters: [{ type: "image", image: {
        link: "https://res.cloudinary.com/synthetic/image/upload/f_jpg,q_auto,w_1200,h_630,c_fit/v123/couple.png",
      } }],
    }]);
    expect(template.components.find((component) => component.type === "button").parameters[0].text).toBe("synthetic-slug");
    expect(template.components.find((component) => component.type === "body").parameters.map((p) => p.parameter_name)).toEqual(["guest_name", "invite_message"]);
  });

  test.each(["", "data:image/png;base64,synthetic", "/couple.jpg", "http://res.cloudinary.com/synthetic/image/upload/couple.jpg", "https://localhost/couple.jpg", "https://res.cloudinary.com.evil.invalid/image/upload/couple.jpg", "https://res.cloudinary.com/synthetic/image/private/couple.jpg", "https://user:password@res.cloudinary.com/synthetic/image/upload/couple.jpg", "https://res.cloudinary.com/synthetic/image/upload/couple.jpg?token=private"])(
    "keeps the public logo fallback for unsuitable photo %s", async (photo) => {
      const template = await send(undefined, photo);
      expect(template.components.find((component) => component.type === "header").parameters[0].image.link).toBe("https://vowlink.co/vowlink-logo.jpg");
    },
  );

  test("preserves template, language, two named body parameters and their order", async () => {
    const template = await send();
    expect(template.name).toBe("vowlink_invitation");
    expect(template.language).toEqual({ code: "en" });
    expect(template.components.filter((component) => component.type === "body")).toEqual([{
      type: "body", parameters: [
        { type: "text", parameter_name: "guest_name", text: "Synthetic Guest" },
        { type: "text", parameter_name: "invite_message", text: "you are specially invited to celebrate the wedding of Synthetic Couple." },
      ],
    }]);
  });

  test("preserves the slug-only URL button with no prefix or literal/encoded placeholder", async () => {
    const template = await send();
    const button = template.components.find((component) => component.type === "button");
    expect(button).toEqual({ type: "button", sub_type: "url", index: "0",
      parameters: [{ type: "text", text: "synthetic-slug" }] });
    expect(button.parameters[0].text).not.toMatch(/https?:|invite\/|\{\{1\}\}|%7b/i);
    expect(template.components.map((component) => component.type)).toEqual(["header", "body", "button"]);
  });

  test("also adds the header when the default invitation template name is used", async () => {
    delete process.env.WHATSAPP_INVITE_TEMPLATE_NAME;
    expect((await send()).components.filter((component) => component.type === "header")).toHaveLength(1);
  });

  test.each([undefined, "", "unrecognized"])("defaults to strict slug mode for configuration %s", async (mode) => {
    if (mode === undefined) delete process.env.WHATSAPP_URL_BUTTON_VALUE_MODE;
    else process.env.WHATSAPP_URL_BUTTON_VALUE_MODE = mode;
    const template = await send();
    expect(template.components.find((component) => component.type === "button").parameters[0].text).toBe("synthetic-slug");
  });

  test("extracts only the invitation slug with an optional trailing slash", async () => {
    const template = await send("https://vowlink.co/invite/synthetic--slug-123/");
    expect(template.components.find((component) => component.type === "button").parameters[0].text).toBe("synthetic--slug-123");
  });

  test.each([
    "", "synthetic-slug", "/invite/synthetic-slug", "not a URL",
    "https://vowlink.co/other/synthetic-slug", "https://vowlink.co/invite/",
    "https://vowlink.co/invite/---", "https://vowlink.co/invite/slug/extra",
    "https://vowlink.co/invite/{{1}}slug", "https://vowlink.co/invite/%7B%7B1%7D%7Dslug",
    "https://vowlink.co/invite/slug?token=private", "https://vowlink.co/invite/slug#private",
    "https://user:password@vowlink.co/invite/slug", "ftp://vowlink.co/invite/slug",
    "https://vowlink.co/invite/slug%2Fextra", "https://vowlink.co/invite/slug\\extra",
  ])("rejects an invalid invitation link before Meta fetch: %s", async (inviteLink) => {
    await expect(send(inviteLink)).rejects.toThrow("Invalid invitation URL for WhatsApp sending.");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each([["full", "https://vowlink.co/invite/synthetic-slug"], ["path", "invite/synthetic-slug"]])(
    "preserves the explicit legacy %s mode", async (mode, expected) => {
      process.env.WHATSAPP_URL_BUTTON_VALUE_MODE = mode;
      const template = await send();
      expect(template.components.find((component) => component.type === "button").parameters[0].text).toBe(expected);
    },
  );

  test("does not impose an image header on a differently configured template", async () => {
    process.env.WHATSAPP_INVITE_TEMPLATE_NAME = "synthetic_other_template";
    expect((await send()).components.map((component) => component.type)).toEqual(["body", "button"]);
  });
});

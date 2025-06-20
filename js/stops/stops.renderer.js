// js/stops/stops.renderer.js
const StopsRenderer = {
  drawDefaultMarker: (ctx, x, y, isActive, gameTime = 0) => {
    const baseColor = isActive ? "yellow" : "orange";
    const detailColor = isActive ? "black" : "#333";

    let pulseFactor = 1.0;
    if (isActive) {
      pulseFactor = 1.0 + ((Math.sin(gameTime * 5) + 1) / 2) * 0.1;
    }

    drawPixelRect(
      ctx,
      x - 15 * pulseFactor,
      y - 60 * pulseFactor,
      30 * pulseFactor,
      60 * pulseFactor,
      baseColor
    );
    drawPixelRect(
      ctx,
      x - 12 * pulseFactor,
      y - 55 * pulseFactor,
      24 * pulseFactor,
      30 * pulseFactor,
      detailColor
    );
    if (isActive) {
      ctx.fillStyle = "yellow";
      ctx.font = "10px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("!", x, y - 40);
      ctx.textAlign = "left";
    }
  },

  drawArcadeCabinet: (ctx, x, y, isActive, gameTime = 0) => {
    const themePalette = Palettes.gaming;
    if (
      !themePalette ||
      !themePalette.objects_primary ||
      !themePalette.emissive ||
      !themePalette.props ||
      !themePalette.objects_accent
    ) {
      StopsRenderer.drawDefaultMarker(ctx, x, y, isActive, gameTime);
      return;
    }

    const cabinetWidth = 32;
    const cabinetHeight = 55;
    const screenHeight = 18;
    const controlPanelHeight = 10;
    const baseHeight = 6;

    let mainColor = themePalette.objects_primary.base;
    let accentColor = themePalette.objects_primary.shadow;
    let screenColor =
      themePalette.emissive && themePalette.emissive.length > 0
        ? themePalette.emissive[0]
        : "#FFFF00";
    let highlightColor = themePalette.objects_primary.light;

    if (isActive) {
      const pulse = (Math.sin(gameTime * 6) + 1) / 2;
      mainColor = interpolateColor(
        themePalette.objects_primary.base,
        themePalette.objects_primary.light,
        pulse * 0.5
      );
      if (themePalette.emissive && themePalette.emissive.length > 0) {
        screenColor = getRandomColor(themePalette.emissive);
      } else {
        screenColor = "#FFFF00";
      }
    }

    drawPixelRect(
      ctx,
      x - cabinetWidth / 2,
      y - baseHeight,
      cabinetWidth,
      baseHeight,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2,
      y - cabinetHeight,
      cabinetWidth,
      cabinetHeight - baseHeight,
      mainColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2,
      y - cabinetHeight,
      3,
      cabinetHeight - baseHeight,
      accentColor
    );
    drawPixelRect(
      ctx,
      x + cabinetWidth / 2 - 3,
      y - cabinetHeight,
      3,
      cabinetHeight - baseHeight,
      highlightColor
    );

    const cpWidth = cabinetWidth + 6;
    const controlPanelColor =
      themePalette.objects_accent && themePalette.objects_accent.length > 0
        ? themePalette.objects_accent[0]
        : "#FF00FF";
    drawPixelRect(
      ctx,
      x - cpWidth / 2,
      y - baseHeight - controlPanelHeight,
      cpWidth,
      controlPanelHeight,
      controlPanelColor
    );
    drawPixelRect(
      ctx,
      x - 5,
      y - baseHeight - controlPanelHeight - 6,
      4,
      6,
      accentColor
    );
    const joystickTopColor =
      themePalette.props && themePalette.props.length > 0
        ? themePalette.props[0]
        : "#FF0000";
    drawPixelRect(
      ctx,
      x - 6,
      y - baseHeight - controlPanelHeight - 9,
      6,
      3,
      joystickTopColor
    );

    const buttonColor1Active =
      themePalette.props && themePalette.props.length > 1
        ? themePalette.props[1]
        : "#FFFF00";
    const buttonColor1Inactive =
      themePalette.props && themePalette.props.length > 2
        ? themePalette.props[2]
        : "#00FF00";
    const buttonColor2Active =
      themePalette.props && themePalette.props.length > 2
        ? themePalette.props[2]
        : "#00FF00";
    const buttonColor2Inactive =
      themePalette.props && themePalette.props.length > 1
        ? themePalette.props[1]
        : "#FFFF00";

    drawPixelRect(
      ctx,
      x + 2,
      y - baseHeight - controlPanelHeight + 3,
      3,
      3,
      isActive ? buttonColor1Active : buttonColor1Inactive
    );
    drawPixelRect(
      ctx,
      x + 7,
      y - baseHeight - controlPanelHeight + 3,
      3,
      3,
      isActive ? buttonColor2Active : buttonColor2Inactive
    );

    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 + 3,
      y - cabinetHeight + 5,
      cabinetWidth - 6,
      screenHeight + 10,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 + 5,
      y - cabinetHeight + 7,
      cabinetWidth - 10,
      screenHeight,
      "#000000"
    );

    if (isActive) {
      const numFrames = 3;
      const screenFrame = Math.floor(gameTime * 2) % numFrames;
      const screenPixelSize = 2;
      const screenContentX = x - cabinetWidth / 2 + 6;
      const screenContentY = y - cabinetHeight + 8;
      const activeScreenColor =
        themePalette.emissive && themePalette.emissive.length > 0
          ? screenColor
          : "#FFFF00";
      const playerShipColor =
        themePalette.props && themePalette.props.length > 2
          ? Palettes.gaming.props[2]
          : "#00FF00";

      if (screenFrame === 0) {
        drawPixelRect(
          ctx,
          screenContentX + 4,
          screenContentY + 2,
          screenPixelSize * 2,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 2,
          screenContentY + 4,
          screenPixelSize * 4,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX,
          screenContentY + 6,
          screenPixelSize * 6,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 2,
          screenContentY + 8,
          screenPixelSize,
          screenPixelSize,
          activeScreenColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 8,
          screenContentY + 8,
          screenPixelSize,
          screenPixelSize,
          activeScreenColor
        );
      } else if (screenFrame === 1) {
        drawPixelRect(
          ctx,
          screenContentX + 6,
          screenContentY + 10,
          screenPixelSize * 2,
          screenPixelSize,
          playerShipColor
        );
        drawPixelRect(
          ctx,
          screenContentX + 4,
          screenContentY + 12,
          screenPixelSize * 4,
          screenPixelSize,
          playerShipColor
        );
      } else {
        const explosionColor =
          themePalette.emissive && themePalette.emissive.length > 0
            ? getRandomColor(Palettes.gaming.emissive)
            : "#FF8C00";
        drawPixelRect(
          ctx,
          screenContentX + 4,
          screenContentY + 5,
          screenPixelSize * 3,
          screenPixelSize * 3,
          explosionColor
        );
      }
    }

    const marqueeHeight = 10;
    const marqueeAccentColor =
      themePalette.objects_accent && themePalette.objects_accent.length > 1
        ? themePalette.objects_accent[1]
        : "#00FF00";
    drawPixelRect(
      ctx,
      x - cabinetWidth / 2 - 2,
      y - cabinetHeight - marqueeHeight,
      cabinetWidth + 4,
      marqueeHeight,
      marqueeAccentColor
    );
    const marqueeTextColorActive =
      themePalette.emissive && themePalette.emissive.length > 2
        ? themePalette.emissive[2]
        : "#FF69B4";
    if (isActive) {
      drawPixelRect(
        ctx,
        x - 5,
        y - cabinetHeight - marqueeHeight + 3,
        10,
        4,
        marqueeTextColorActive
      );
    } else {
      drawPixelRect(
        ctx,
        x - 5,
        y - cabinetHeight - marqueeHeight + 3,
        10,
        4,
        themePalette.objects_primary.shadow
      );
    }

    if (isActive) {
      const glowBaseColor =
        themePalette.emissive && themePalette.emissive.length > 0
          ? themePalette.emissive[0]
          : "#FFFF00";
      ctx.globalAlpha = ((Math.sin(gameTime * 5) + 1) / 2) * 0.3 + 0.1;
      drawPixelRect(
        ctx,
        x - cabinetWidth / 2 - 5,
        y - cabinetHeight - marqueeHeight - 5,
        cabinetWidth + 10,
        cabinetHeight + marqueeHeight + baseHeight + 10,
        glowBaseColor
      );
      ctx.globalAlpha = 1.0;
    }
  },

  drawHolographicTerminal: (ctx, x, y, isActive, gameTime = 0) => {
    const themePalette = Palettes.futuristic;
    if (
      !themePalette ||
      !themePalette.emissive ||
      !themePalette.objects_primary ||
      !themePalette.objects_accent
    ) {
      StopsRenderer.drawDefaultMarker(ctx, x, y, isActive, gameTime);
      return;
    }

    const baseWidth = 40;
    const baseHeight = 10;
    const postHeight = 20;
    const screenWidth = 35;
    const screenHeight = 25;

    let primaryColor =
      themePalette.emissive && themePalette.emissive.length > 0
        ? themePalette.emissive[0]
        : "#00FFFF";
    let accentColor = themePalette.objects_primary.shadow;
    let baseStructColor = themePalette.objects_primary.base;

    if (isActive) {
      const pulse = (Math.sin(gameTime * 4) + 1) / 2;
      if (themePalette.emissive && themePalette.emissive.length > 1) {
        primaryColor = interpolateColor(
          themePalette.emissive[0],
          themePalette.emissive[1],
          pulse
        );
      } else if (themePalette.emissive && themePalette.emissive.length > 0) {
        primaryColor = themePalette.emissive[0];
      } else {
        primaryColor = "#00FFFF";
      }
      baseStructColor = lightenDarkenColor(
        themePalette.objects_primary.base,
        Math.floor(pulse * 20)
      );
    }

    drawPixelRect(
      ctx,
      x - baseWidth / 2,
      y - baseHeight,
      baseWidth,
      baseHeight,
      baseStructColor
    );
    drawPixelRect(
      ctx,
      x - baseWidth / 2 + 2,
      y - baseHeight + 2,
      baseWidth - 4,
      baseHeight - 4,
      accentColor
    );
    drawPixelRect(
      ctx,
      x - 4,
      y - baseHeight - postHeight,
      8,
      postHeight,
      baseStructColor
    );

    const screenY = y - baseHeight - postHeight - screenHeight;

    const numLayers = isActive ? 4 : 2;
    for (let i = 0; i < numLayers; i++) {
      const layerAlpha = isActive ? 0.2 + i * 0.15 : 0.3 + i * 0.1;
      const layerOffset = isActive ? Math.sin(gameTime * 2 + i) * 3 : 0;
      const layerWidth = screenWidth + i * 4;
      const layerHeight = screenHeight + i * 2;

      ctx.globalAlpha = layerAlpha;
      drawPixelRect(
        ctx,
        x - layerWidth / 2,
        screenY - i * 2 + layerOffset,
        layerWidth,
        layerHeight,
        primaryColor
      );
      ctx.globalAlpha = 1.0;
    }

    const strokeStyleColor =
      themePalette.objects_accent && themePalette.objects_accent.length > 0
        ? themePalette.objects_accent[0]
        : themePalette.objects_primary.light;
    ctx.strokeStyle = isActive
      ? strokeStyleColor
      : themePalette.objects_primary.light;
    ctx.lineWidth = 1;
    const lineCount = 5;
    for (let i = 0; i < lineCount; i++) {
      const lineYVal = screenY + 4 + i * (screenHeight / lineCount);
      const scrollOffset = isActive ? (gameTime * 15 + i * 5) % screenWidth : 0;
      ctx.beginPath();
      ctx.moveTo(
        Math.floor(x - screenWidth / 2 + 3 + scrollOffset),
        Math.floor(lineYVal)
      );
      ctx.lineTo(
        Math.floor(x - screenWidth / 2 + 3 + scrollOffset - 10),
        Math.floor(lineYVal)
      );
      ctx.stroke();

      if (isActive && Math.random() < 0.3) {
        const glyphColor =
          themePalette.emissive && themePalette.emissive.length > 2
            ? themePalette.emissive[2]
            : "#FFFF00";
        drawPixelRect(
          ctx,
          x - screenWidth / 2 + getRandomInt(5, screenWidth - 10),
          lineYVal - 2,
          2,
          2,
          glyphColor
        );
      }
    }

    if (isActive) {
      ctx.globalAlpha = ((Math.sin(gameTime * 5) + 1) / 2) * 0.2 + 0.1;
      drawPixelRect(
        ctx,
        x - screenWidth / 2 - 10,
        screenY - 10,
        screenWidth + 20,
        screenHeight + 20,
        primaryColor
      );
      ctx.globalAlpha = 1.0;
    }
  },

  drawPixelWarehouse: (ctx, x, y, isActive, gameTime = 0) => {
    const themePalette = Palettes.industrial;
    if (
      !themePalette ||
      !themePalette.objects_primary ||
      !themePalette.objects_accent ||
      !themePalette.emissive
    ) {
      StopsRenderer.drawDefaultMarker(ctx, x, y, isActive, gameTime);
      return;
    }

    const buildingWidth = 55;
    const buildingHeight = 45;
    const roofHeight = 12;
    const doorWidth = 18;
    const doorHeight = 28;

    let mainColor = themePalette.objects_primary.base;
    let roofColor = themePalette.objects_primary.shadow;
    let doorColor =
      themePalette.objects_accent && themePalette.objects_accent.length > 1
        ? themePalette.objects_accent[1]
        : "#A0522D";
    let highlightColor = themePalette.objects_primary.light;

    if (isActive) {
      const pulse = (Math.sin(gameTime * 3) + 1) / 2;
      mainColor = lightenDarkenColor(
        themePalette.objects_primary.base,
        Math.floor(pulse * 10)
      );
      if (
        themePalette.objects_accent &&
        themePalette.objects_accent.length > 1 &&
        themePalette.emissive &&
        themePalette.emissive.length > 0
      ) {
        doorColor = interpolateColor(
          themePalette.objects_accent[1],
          themePalette.emissive[0],
          pulse
        );
      } else {
        doorColor = "#FFA500";
      }
    }

    drawPixelRect(
      ctx,
      x - buildingWidth / 2,
      y - buildingHeight,
      buildingWidth / 3,
      buildingHeight,
      themePalette.objects_primary.shadow
    );
    drawPixelRect(
      ctx,
      x - buildingWidth / 2 + buildingWidth / 3,
      y - buildingHeight,
      buildingWidth / 3,
      buildingHeight,
      mainColor
    );
    drawPixelRect(
      ctx,
      x - buildingWidth / 2 + (buildingWidth * 2) / 3,
      y - buildingHeight,
      buildingWidth / 3,
      buildingHeight,
      highlightColor
    );

    for (let i = 0; i < buildingHeight; i += 4) {
      drawPixelRect(
        ctx,
        x - buildingWidth / 2,
        y - buildingHeight + i,
        buildingWidth,
        1,
        lightenDarkenColor(mainColor, -20)
      );
    }

    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(
      Math.floor(x - buildingWidth / 2 - 3),
      Math.floor(y - buildingHeight)
    );
    ctx.lineTo(
      Math.floor(x + buildingWidth / 2 + 3),
      Math.floor(y - buildingHeight)
    );
    ctx.lineTo(
      Math.floor(x + buildingWidth / 2),
      Math.floor(y - buildingHeight - roofHeight)
    );
    ctx.lineTo(
      Math.floor(x - buildingWidth / 2),
      Math.floor(y - buildingHeight - roofHeight)
    );
    ctx.closePath();
    ctx.fill();
    drawPixelRect(
      ctx,
      x - buildingWidth / 2,
      y - buildingHeight - roofHeight,
      buildingWidth,
      2,
      lightenDarkenColor(roofColor, 20)
    );

    const doorX = x - doorWidth / 2;
    const doorY = y - doorHeight;
    drawPixelRect(ctx, doorX, doorY, doorWidth, doorHeight, doorColor);
    for (let i = 0; i < doorHeight; i += 6) {
      drawPixelRect(
        ctx,
        doorX,
        doorY + i,
        doorWidth,
        2,
        lightenDarkenColor(doorColor, -30)
      );
    }
    drawPixelRect(
      ctx,
      doorX + doorWidth / 2 - 2,
      doorY + doorHeight * 0.7,
      4,
      2,
      lightenDarkenColor(doorColor, -50)
    );

    if (isActive) {
      const lightOn = Math.floor(gameTime * 2) % 2 === 0;
      const activeLightColor =
        themePalette.emissive && themePalette.emissive.length > 0
          ? themePalette.emissive[0]
          : "#FFA500";
      if (lightOn) {
        drawPixelRect(
          ctx,
          x - 2,
          y - buildingHeight - roofHeight - 5,
          4,
          3,
          activeLightColor
        );
        ctx.globalAlpha = 0.3;
        drawPixelRect(
          ctx,
          x - 4,
          y - buildingHeight - roofHeight - 2,
          8,
          5,
          activeLightColor
        );
        ctx.globalAlpha = 1.0;
      } else {
        drawPixelRect(
          ctx,
          x - 2,
          y - buildingHeight - roofHeight - 5,
          4,
          3,
          themePalette.objects_primary.shadow
        );
      }
    }

    const signAccentColor =
      themePalette.objects_accent && themePalette.objects_accent.length > 0
        ? themePalette.objects_accent[0]
        : "#B7410E";
    const signEmissiveColor =
      themePalette.emissive && themePalette.emissive.length > 1
        ? themePalette.emissive[1]
        : "#FFD700";
    drawPixelRect(
      ctx,
      x + buildingWidth / 2 - 15,
      y - buildingHeight + 5,
      10,
      8,
      themePalette.objects_primary.shadow
    );
    drawPixelRect(
      ctx,
      x + buildingWidth / 2 - 14,
      y - buildingHeight + 6,
      8,
      6,
      isActive ? signEmissiveColor : signAccentColor
    );

    if (isActive) {
      const glowColorActive =
        themePalette.emissive && themePalette.emissive.length > 1
          ? themePalette.emissive[1]
          : "#FFD700";
      ctx.globalAlpha = ((Math.sin(gameTime * 5) + 1) / 2) * 0.15;
      drawPixelRect(
        ctx,
        x - buildingWidth / 2 - 5,
        y - buildingHeight - roofHeight - 5,
        buildingWidth + 10,
        buildingHeight + roofHeight + 10,
        glowColorActive
      );
      ctx.globalAlpha = 1.0;
    }
  },
};

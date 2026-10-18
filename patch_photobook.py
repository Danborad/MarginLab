with open('src/components/album/PhotobookStage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update left hardcover & stack visibility
old_left_base = """                  {/* 左侧封底硬壳与页叠 */}
                  <div
                    style={{
                      opacity: isClosedCover ? 0 : turn?.kind === 'cover' ? (turn.dir === 1 ? turn.progress : 1 - turn.progress) : 1,
                      transition: turn ? 'none' : 'opacity 240ms ease',
                    }}
                  >
                    {renderHardcoverBase('left')}
                    {renderStackLeaves('left')}
                  </div>"""

new_left_base = """                  {/* 左侧封底硬壳与页叠 (仅在画册展开且非封面开合时显示) */}
                  {!isClosedCover && !(turn?.kind === 'cover') && (
                    <div
                      style={{
                        opacity: 1,
                      }}
                    >
                      {renderHardcoverBase('left')}
                      {renderStackLeaves('left')}
                    </div>
                  )}"""

text = text.replace(old_left_base, new_left_base)

# 2. Update right hardcover & stack visibility
old_right_base = """                  {/* 右侧封底硬壳与页叠 */}
                  <div
                    style={{
                      opacity: isClosedBack ? 0 : turn?.kind === 'backCover' ? (turn.dir === 1 ? 1 - turn.progress : turn.progress) : 1,
                      transition: turn ? 'none' : 'opacity 240ms ease',
                    }}
                  >
                    {renderHardcoverBase('right')}
                    {renderStackLeaves('right')}
                  </div>"""

new_right_base = """                  {/* 右侧封底硬壳与页叠 (仅在画册展开且非封底开合时显示) */}
                  {!isClosedBack && !(turn?.kind === 'backCover') && (
                    <div
                      style={{
                        opacity: 1,
                      }}
                    >
                      {renderHardcoverBase('right')}
                      {renderStackLeaves('right')}
                    </div>
                  )}"""

text = text.replace(old_right_base, new_right_base)

# 3. Update static left page condition
old_static_left = """                  {/* 静态左半页 (底座) - 仅在非封面合拢时显示 */}
                  {!isClosedCover && !(turn?.kind === 'cover') && ("""

new_static_left = """                  {/* 静态左半页 (底座) - 仅在画册展开对开且非封面开合时显示 */}
                  {!isClosedCover && !isClosedBack && !(turn?.kind === 'cover') && ("""

text = text.replace(old_static_left, new_static_left)

# 4. Update static right page condition
old_static_right = """                  {/* 静态右半页 (底座) - 仅在非封底合拢时显示 */}
                  {!isClosedBack && !(turn?.kind === 'backCover') && ("""

new_static_right = """                  {/* 静态右半页 (底座) - 仅在画册展开对开且非封底开合时显示 */}
                  {!isClosedCover && !isClosedBack && !(turn?.kind === 'backCover') && ("""

text = text.replace(old_static_right, new_static_right)

# 5. Ensure B. 静止闭合封面 has translateZ(10px) so it sits firmly on top in 3D
old_closed_cover = """                {/* ═══════════════ B. 静止闭合封面 ═══════════════ */}
                {isClosedCover && !turn && (
                  <div
                    onClick={goNext}
                    className="absolute cursor-pointer"
                    style={{
                      left: '50%',
                      top: 0,
                      width: PAGE_W,
                      height: PAGE_H,
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                      zIndex: 30,
                    }}"""

new_closed_cover = """                {/* ═══════════════ B. 静止闭合封面 ═══════════════ */}
                {isClosedCover && !turn && (
                  <div
                    onClick={goNext}
                    className="absolute cursor-pointer"
                    style={{
                      left: '50%',
                      top: 0,
                      width: PAGE_W,
                      height: PAGE_H,
                      transformOrigin: 'left center',
                      transform: 'translateZ(10px)',
                      transformStyle: 'preserve-3d',
                      zIndex: 30,
                    }}"""

text = text.replace(old_closed_cover, new_closed_cover)

# 6. Ensure C. 静止闭合封底 has translateZ(10px)
old_closed_back = """                {/* ═══════════════ C. 静止闭合封底 ═══════════════ */}
                {isClosedBack && !turn && (
                  <div
                    onClick={goPrev}
                    className="absolute cursor-pointer"
                    style={{
                      right: '50%',
                      top: 0,
                      width: PAGE_W,
                      height: PAGE_H,
                      transformOrigin: 'right center',
                      transformStyle: 'preserve-3d',
                      zIndex: 30,
                    }}"""

new_closed_back = """                {/* ═══════════════ C. 静止闭合封底 ═══════════════ */}
                {isClosedBack && !turn && (
                  <div
                    onClick={goPrev}
                    className="absolute cursor-pointer"
                    style={{
                      right: '50%',
                      top: 0,
                      width: PAGE_W,
                      height: PAGE_H,
                      transformOrigin: 'right center',
                      transform: 'translateZ(10px)',
                      transformStyle: 'preserve-3d',
                      zIndex: 30,
                    }}"""

text = text.replace(old_closed_back, new_closed_back)

with open('src/components/album/PhotobookStage.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("PhotobookStage.tsx updated successfully!")

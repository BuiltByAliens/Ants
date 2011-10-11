window.requestAnimFrame = ( ->
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          (callback, element) ->
            window.setTimeout(callback, 1000 / 60)
)();

rand = (base, range) ->
  return base + ( Math.random() * 2 - 1.0 ) * range

clamp = (v, min, max) ->
  return Math.min( max, Math.max( min, v ) )

antWedge = Math.PI * 0.5

hudString = ""
hudPrint = (str) ->
  hudString += str + '<br/>'


class Food
  constructor: ( @xCenter, @xRange, @yCenter, @yRange ) ->
    @reset()
    
  reset: ->
    @amount = 1000
    @spawn = 5
    @x = rand( @xCenter, @xRange )
    @y = rand( @yCenter, @yRange )
  
  loop: (ctx, dt, draw) ->
    if draw 
      @r = @amount * 0.01
      ctx.fillStyle = '#9f4'
      ctx.fillRect( @x-@r, @y-@r, @r*2, @r*2 )
    @r = @amount * 0.02
    
    if @amount <= 300 
      @spawn -= dt
      if @spawn <= 0
        @reset()


  bite: (x, y, dt) ->
    if @amount < 0 
      return 0
    if Math.abs( @x - x ) > @r 
      return 0
    if Math.abs( @y - y ) > @r 
      return 0
      
    res = 500 * dt;
    @amount -= res
    return res


class NeuralNet
  constructor: (@inputCount, @outputCount, @layerCount, @layerSize) ->
    #inputs array, set from outside
    @inputs = ( 0.0 for i in [0...@inputCount] )

    # results array, contains result after execute
    @outputs = ( 0.0 for i in [0...@outputCount] )
      
    # work array to store the value going through each layer
    @work = []
    for l in [0...@layerCount]
      layer = []
      for n in [0...@layerSize]
        layer.push( 0 )
      @work.push( layer )      
      
    # initialize the weights array for every neuron
    @layers = []
    for i in [0...@layerCount]
      layer = []
      for n in [0...@layerSize]
        neuron = []
        if ( i == 0 )
          # layer 0 needs as many weights as there are inputs
          for w in [0...@inputCount]
            neuron.push( 0 )
        else
          # the normal layers need as many weights as the previous layer
          for w in [0...@layerSize]
            neuron.push( 0 )      
        layer.push( neuron )
      @layers.push( layer )

    # the last layer only has as many neurons as there are outputs
    lastLayer = []
    for i in [0...@outputCount]
      neuron = []
      for w in [0...@layerSize]
        neuron.push( 0 )      
      lastLayer.push( neuron )
    @layers.push( lastLayer )
    
    
  getDNA: ->
    res = []
    for layer in @layers
      res = res.concat( n ) for n in layer
    return res

  setDNA: (dna) ->
    idx = 0
    for layer in @layers
      for n in layer
        for i in [0...n.length]
          n[i] = dna[idx++]

    
  mutate: (severity) ->
    for layer in @layers
      for n in layer
        for i in [0...n.length]
          n[i] = clamp( n[i] + rand(0,severity), -1, 1 )
    
  clone: (source) ->
    for layer, li in @layers
      for neuron, ni in layer
        for i in [0...neuron.length]
          neuron[i] = source.layers[li][ni][i]
    
  execute: ->
    # begin with piping input into layer 1
    for n in [0...@layerSize]
      @work[0][n] = 0
      layer = @layers[0][n]
      for i in [0...@inputCount]
        @work[0][n] += @inputs[i] * layer[i]
        
    # now propagate through remaining layers
    for l in [1...@layerCount]
      work = @work[l]
      prev = @work[l-1]
      for n in [0...@layerSize]
        work[n] = 0
        layer = @layers[l][n]
        for i in [0...@layerSize]
          work[n] += prev[i] * layer[i]
    
    # finally, pipe result to output neurons
    oWork = @work[@layerCount-1]
    lastLayer = @layers[@layerCount]
    for o in [0...@outputCount]
      @outputs[o] = 0
      for n in [0...@layerSize]
        @outputs[o] += oWork[n] * lastLayer[o][n]
        
antID = 0

class Ant
  constructor: (@owner) ->
    @getNewID()
    @net = new NeuralNet( 3, 2, 3, 10 )
    @net.mutate(0.1)
    @radius = 10
    @x = 0
    @y = 0
    @maxHealth = 3000
    @reset()

  teleport: (@x, @y) ->
    return null

  reset: ->
    @leftLeg = 0
    @rightLeg = 0
    @health = @maxHealth * 0.5
    @dead = false
    @ndx = rand(0,1)
    @ndy = Math.sqrt( 1 - @ndx * @ndx )
    @age = 0
    @sinceFood = 0
    @collided = 0
    return null
        
  getNewID: ->
    @id = antID++ 
    
        
  loop: (ctx, dt, draw) ->
    
    if not @dead      
      @age += dt
      @sinceFood += dt
      
      # check for food, unless we're overstuffed
      ate = 0
      if ( @health / @maxHealth ) < 1
        food = @owner.getFood( @x, @y, dt )
        if food > 0 
          ate = 1
          @sinceFood = 0
        @health += food

      # do some thinking 
      @net.inputs[0] = @health / @maxHealth
      @net.inputs[1] = clamp( @sinceFood, 0, 1 )
      @net.inputs[2] = @collided
      @net.execute()
      legScale = 10
      @leftLeg = clamp( @net.outputs[0] * legScale, -90, 100 )
      @rightLeg = clamp( @net.outputs[1] * legScale, -90, 100 )

      
      # spend energy to live and move
      energy = 15 + ( Math.abs( @leftLeg ) + Math.abs( @rightLeg ) ) * 0.1
      @health -= dt * energy
    
      # dead yet?
      if @health < 0 
        @dead = true
        @health = 0
    
    if not @dead 
      #move
      #tank movement is always an arc: figure out the center and how big
      inl = 1.0 / @leftLeg
      inr = 1.0 / @rightLeg
      div = inl - inr
      if div == 0
        # we're traveling straight
        @x += dt * @leftLeg * @ndx
        @y += dt * @leftLeg * @ndy
        #@speed = @leftLeg * dt
      else
        # the arc's center will be off to the slower wheel's side
        # when one wheel isn't moving, we're pivoting around that wheel
        if @leftLeg == 0 or @rightLeg == 0
          tRadius = @radius        
        else
          tRadius = Math.abs( @radius * ( inl + inr ) / div )
          
        # distance traveled will be in angles around the turning center
        circumference = Math.PI * ( tRadius + @radius ) * 2
        if Math.abs(@leftLeg) > Math.abs(@rightLeg)
          angle = @leftLeg / -circumference * dt * Math.PI * 2
          tX = @x - @ndy * tRadius
          tY = @y + @ndx * tRadius
        else
          angle = @rightLeg / circumference * dt * Math.PI * 2
          tX = @x + @ndy * tRadius
          tY = @y - @ndx * tRadius
            
        if draw        
          ctx.fillStyle = '#555'
          ctx.strokeStyle = '#555'
          ctx.fillRect( tX, tY, 2, 2 )
          ctx.beginPath()
          ctx.arc(tX, tY, Math.abs( tRadius ), 0, Math.PI*2, true)
          ctx.closePath()
          ctx.stroke()      
        
        si = Math.sin( angle )
        co = Math.cos( angle )
        
        # build a rotation matrix to spin around the turning center
        m00 = co; m01 = -si
        m10 = si; m11 =  co
        m20 = -tX*co - tY*si + tX; 
        m21 = -tX*-si - tY*co + tY;
        
        # spin position
        txx = @x
        tyy = @y
        @x = txx * m00 + tyy * m10 + m20
        @y = txx * m01 + tyy * m11 + m21
        
        #sx = @x - txx
        #sy = @y - tyy
        #@speed = Math.sqrt( sx*sx + sy*sy )
        
        # spin heading
        txx = @ndx
        tyy = @ndy
        @ndx = txx * m00 + tyy * m10
        @ndy = txx * m01 + tyy * m11
       
      #collide with walls
      [@x, @y, col] = @owner.collide( @x, @y )
      if col then @collided = -1 else @collided = 0
    
    if @dead then res = 0 else res = 1  
    
    if not draw then return res
    
    ctx.save()
    ctx.transform( @ndx, @ndy, -@ndy, @ndx, @x, @y )
    ctx.fillStyle = '#000'
    
    #head
    ctx.beginPath()
    ctx.arc(0, 0, @radius, -antWedge, antWedge, false)
    ctx.closePath()
    ctx.fill()      
    
    if not @dead
      #belly
      ctx.beginPath()
      ctx.arc(0, 0, @radius * @health / @maxHealth * 2.0, -antWedge, antWedge, true)
      ctx.closePath()
      ctx.fill()
    
      #legs
      ctx.fillStyle = ['rgb(', (@leftLeg*-5).toFixed(0), ',', (@leftLeg*5).toFixed(0), ',1)'].join('')
      ctx.fillRect( -@radius, -@radius, @radius * 2, -2 )

      ctx.fillStyle = ['rgb(', (@rightLeg*-5).toFixed(0), ',', (@rightLeg*5).toFixed(0), ',1)'].join('')
      ctx.fillRect( -@radius, @radius, @radius * 2, 2 )
    
    ctx.restore()    
    
    return res
    

  inspect: ->
    ins = "<table>"
    ins += "<tr><td>" + ( i.toFixed(2) for i in @net.inputs).join('</td><td>') + "</td></tr>"
    for layer in @net.work
      ins += "<tr><td>" + ( i.toFixed(2) for i in layer).join('</td><td>') + "</td></tr>"
    ins += "<tr><td>" + ( i.toFixed(2) for i in @net.outputs).join('</td><td>') + "</td></tr>"
    ins += "</table>"
    return ins


class Sim
  constructor: (@canvasName) ->
    @ctx = $(canvasName)[0].getContext("2d")
    @width = $(canvasName).width()
    @height = $(canvasName).height()
    @elapsed = 0
    @drawSkip = 0
    
    @generation = 0
    
    if false
      foodx = @width/2
      foodxr = @width/2
      foody = @height/2
      foodyr = @height/2
    else
      foodx = 400
      foodxr = 300
      foody = 200 
      foodyr = 30
    
    @ants = ( new Ant(@) for num in [1..10] )
    @foods = ( new Food( foodx, foodxr, foody, foodyr  ) for num in [1..20] )
    @lastBestTime = 0
    
    @startNewGeneration()
    
  collide: ( xx, yy ) ->
    x = clamp( xx, 0, @width )
    y = clamp( yy, 0, @height )
    return [x, y, xx != x or yy != y]
    
  getFood: (x, y, dt)->
    yum = 0
    ( yum += food.bite(x, y, dt) ) for food in @foods    
    return yum
    
  startNewGeneration: ->
    @generation++
    @elapsed = 0
    
    id = "<p>Ant: #{@ants[0].id} / #{@lastBestTime.toFixed(2)} seconds</p>"
    id += "<p class='dna'><i>#{ ( w.toFixed(2) for w in @ants[0].net.getDNA() ).join('</i><i>') } </i></p>"
    $('#ant-id').html( id )    
    
    for ant in @ants
      ant.age += ant.health / ant.maxHealth
      
    # sort ants by best survivor
    anySwaps = false
    swapPass = =>
      for r in [0...@ants.length-1]
        if @ants[r].age < @ants[r+1].age
          anySwaps = true
          [@ants[r], @ants[r+1]] = [@ants[r+1], @ants[r]]

    swapPass()
    while anySwaps
      anySwaps = false
      swapPass()

    @lastBestTime = @ants[0].age
    
    # mutate the ants, slowing down mutation as we start to get success
    mutation = 0.3
    if ( @ants[0].age > 50 )
      mutation /= 10

    if ( @ants[0].age > 150 )
      mutation /= 100

    if ( @ants[0].age > 500 )
      mutation /= 500

    # most of the ants are "children" of the first 5, mutated a little more harshly
    for i in [5...@ants.length]
      @ants[i].net.clone( @ants[i%5].net )
      @ants[i].net.mutate( mutation * 10 )
      @ants[i].getNewID()
    
    # the last ant is a runt, and gets mutated severely... just in case we get lucky  
    @ants[@ants.length-1].net.mutate(0.15)

    # first five ants get mutated gently
    for i in [0...5]
      @ants[i].net.mutate( mutation )

    # restock food
    for food in @foods
      food.reset()
      
    # reset the ants and place them randomly
    for ant in @ants
      ant.reset()
      ant.teleport( rand(@width/2, 100), rand(@height/4, 20) )
    
    return null
    
    
  loop: (dt)->
    hudString = ""

    for tick in [1...window.drawSkipCount]
      food.loop(@ctx,dt,false) for food in @foods    
      ant.loop(@ctx,dt,false) for ant in @ants
      @elapsed += dt

    @ctx.clearRect( 0, 0, @width, @height )
    food.loop(@ctx,dt,true) for food in @foods    
    
    alive = 0
    ( alive += ant.loop(@ctx,dt,true) ) for ant in @ants
        
    @elapsed += dt
    
    deadline = 50
    if @generation > 100
      deadline = 150
    if @generation > 200
      deadline = 300
    if @generation > 300
      deadline = 400
    if @generation > 500
      deadline = 1000
    
    if @elapsed > deadline or alive == 0 
      @startNewGeneration()
    
    hudPrint( "elapsed: " + @elapsed.toFixed(2) + " secs" )
    hudPrint( "" + alive + " ants alive" )
    hudPrint( "generation " + @generation )
            
    $('#output').html( hudString )
    
    $('#ant-inspect').html( @ants[0].inspect() );  
    
    return true # @generation < 1000



$(document).ready ->
  window.sim = new Sim( '#stage' )
  window.simSpeed = 0.01
  window.drawSkipCount = 100
  
  $('#realtime').click -> 
    window.drawSkipCount = 0 
    window.simSpeed = 0.001
  $('#fast').click -> 
    window.drawSkipCount = 0
    window.simSpeed = 0.01 
  $('#reallyfast').click -> 
    window.drawSkipCount = 100
    window.simSpeed = 0.01
  
  $('#realtime').click()
  
  animLoop = ( frameCallback, element ) ->
    running = new Date
    lastFrame = new Date
    frameExec = (now) ->
      if running != false
        now = now ? new Date
        running = frameCallback( ( now - lastFrame ) * window.simSpeed )
        lastFrame = now
        if window.drawSkipCount == 0 
          requestAnimFrame( frameExec, element )
        else
          setTimeout( frameExec, 1 )

    frameExec( lastFrame )

  animLoop( 
    (deltaT) ->
      return sim.loop(deltaT)
    ,$('#stage').get(0) );
    
    
  net = new NeuralNet( 2, 2, 2, 4 )
  net.inputs[0] = rand( 100, 50 )
  net.inputs[1] = rand( 100, 50 )
  net.execute()
  console.log net, net.outputs[0], net.outputs[1]
  
  